const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");
const SupportConfig = require("./models/SupportConfig");

let io = null;

const JWT_SECRET = process.env.JWT_SECRET || "techzone_super_secret_change_me";
const ADMIN_SECRET = "techzone-admin-secret";

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const token = auth.token;
      const adminKey = auth.adminKey || socket.handshake.headers["x-admin-key"];

      // 1. Check if connecting as Admin
      if (adminKey === ADMIN_SECRET || auth.role === "admin") {
        socket.user = {
          role: "admin",
          isAdmin: true,
          name: auth.name || "TechZone Support Agent"
        };
        return next();
      }

      // 2. Check if connecting with JWT (Customer or Guest signed token)
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          socket.user = {
            role: decoded.role || (decoded.isAdmin ? "admin" : "customer"),
            isAdmin: Boolean(decoded.isAdmin || decoded.role === "admin"),
            customerId: decoded.id || decoded.guestId || decoded.userId,
            name: decoded.name || "Customer"
          };
          return next();
        } catch (err) {
          // Token expired or invalid
          return next(new Error("Authentication token invalid or expired"));
        }
      }

      // 3. Fallback for guest initialization handshake
      if (auth.guestId) {
        // Generate temporary guest context if valid format
        socket.user = {
          role: "customer",
          isAdmin: false,
          customerId: auth.guestId,
          name: auth.name || "Guest Customer"
        };
        return next();
      }

      return next(new Error("Authentication required to connect to support socket"));
    } catch (e) {
      return next(new Error("Socket authentication error: " + e.message));
    }
  });

  io.on("connection", (socket) => {
    // If admin, auto-join admin room
    if (socket.user?.isAdmin) {
      socket.join("admin_room");
    }

    // Join a specific conversation room after verifying authorization
    socket.on("join_conversation", async ({ conversationId }, callback) => {
      try {
        if (!conversationId) {
          if (callback) callback({ success: false, error: "Conversation ID is required" });
          return;
        }

        const conv = await Conversation.findOne({ conversationId });
        if (!conv) {
          if (callback) callback({ success: false, error: "Conversation not found" });
          return;
        }

        // Authorization check: Admins can join any conversation. Customers can only join their own.
        if (!socket.user.isAdmin) {
          if (conv.customerId !== socket.user.customerId) {
            if (callback) callback({ success: false, error: "Unauthorized access to conversation" });
            return;
          }
        }

        const roomName = `conv_${conversationId}`;
        socket.join(roomName);

        if (callback) callback({ success: true, room: roomName });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Leave conversation room
    socket.on("leave_conversation", ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv_${conversationId}`);
      }
    });

    // Client typing indicator
    socket.on("typing", ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`conv_${conversationId}`).emit("user_typing", {
        conversationId,
        isTyping,
        senderRole: socket.user.isAdmin ? "admin" : "customer",
        senderName: socket.user.name
      });
      if (!socket.user.isAdmin) {
        socket.to("admin_room").emit("user_typing", {
          conversationId,
          isTyping,
          senderRole: "customer",
          senderName: socket.user.name
        });
      }
    });

    // Send a message via socket
    socket.on("send_message", async (payload, callback) => {
      try {
        const { conversationId, text, messageType = "text", orderData = null, quickReplyKey = "" } = payload;

        if (!conversationId || !text || !text.trim()) {
          if (callback) callback({ success: false, error: "Message text cannot be empty" });
          return;
        }

        const cleanText = text.trim();
        if (cleanText.length > 2000) {
          if (callback) callback({ success: false, error: "Message exceeds maximum length (2000 chars)" });
          return;
        }

        const conv = await Conversation.findOne({ conversationId });
        if (!conv) {
          if (callback) callback({ success: false, error: "Conversation not found" });
          return;
        }

        // Verify sender authorization
        const isAdmin = socket.user.isAdmin;
        if (!isAdmin && conv.customerId !== socket.user.customerId) {
          if (callback) callback({ success: false, error: "Unauthorized access" });
          return;
        }

        const sender = isAdmin ? "admin" : "customer";
        const senderName = isAdmin ? (payload.senderName || "TechZone Support") : (conv.customerName || "Customer");

        // Create message in database
        const newMsg = await Message.create({
          conversationId,
          sender,
          senderName,
          text: cleanText,
          messageType,
          orderData,
          quickReplyKey,
          isRead: false
        });

        // Update conversation state
        const updateFields = {
          lastMessage: {
            text: cleanText,
            sender,
            createdAt: newMsg.createdAt
          },
          lastMessageAt: newMsg.createdAt
        };

        if (isAdmin) {
          updateFields.$inc = { unreadCountCustomer: 1 };
          // If conversation was resolved, reopen it or set pending
          if (conv.status === "resolved") {
            updateFields.status = "open";
          }
        } else {
          updateFields.$inc = { unreadCountAdmin: 1 };
          if (conv.status === "resolved") {
            updateFields.status = "open";
          }
        }

        const updatedConv = await Conversation.findOneAndUpdate(
          { conversationId },
          updateFields,
          { new: true }
        );

        // Broadcast to conversation room
        io.to(`conv_${conversationId}`).emit("new_message", {
          message: newMsg,
          conversation: updatedConv
        });

        // Also notify admin room of customer message and updated conversation list
        io.to("admin_room").emit("admin_conversation_update", {
          conversation: updatedConv,
          newMsg
        });

        if (callback) callback({ success: true, message: newMsg });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Mark messages as read
    socket.on("mark_read", async ({ conversationId, reader }, callback) => {
      try {
        if (!conversationId) return;
        const conv = await Conversation.findOne({ conversationId });
        if (!conv) return;

        if (reader === "admin" || socket.user.isAdmin) {
          await Message.updateMany(
            { conversationId, sender: "customer", isRead: false },
            { $set: { isRead: true } }
          );
          await Conversation.updateOne({ conversationId }, { $set: { unreadCountAdmin: 0 } });
        } else {
          if (conv.customerId !== socket.user.customerId) return;
          await Message.updateMany(
            { conversationId, sender: "admin", isRead: false },
            { $set: { isRead: true } }
          );
          await Conversation.updateOne({ conversationId }, { $set: { unreadCountCustomer: 0 } });
        }

        io.to(`conv_${conversationId}`).emit("messages_read", { conversationId, reader });
        io.to("admin_room").emit("admin_messages_read", { conversationId, reader });

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Admin toggles availability
    socket.on("update_support_status", async (newStatus, callback) => {
      if (!socket.user?.isAdmin) {
        if (callback) callback({ success: false, error: "Only admins can change support availability" });
        return;
      }
      try {
        const config = await SupportConfig.findOneAndUpdate(
          { key: "default_config" },
          { $set: newStatus },
          { new: true, upsert: true }
        );
        io.emit("support_status_changed", config);
        if (callback) callback({ success: true, config });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("disconnect", () => {
      // Socket disconnected cleanly
    });
  });

  return io;
}

function getIO() {
  return io;
}

// Helper function to broadcast new messages from REST endpoints
function broadcastNewMessage(conversationId, message, conversation) {
  if (!io) return;
  io.to(`conv_${conversationId}`).emit("new_message", { message, conversation });
  io.to("admin_room").emit("admin_conversation_update", { conversation, newMsg: message });
}

// Helper function to broadcast status change
function broadcastConversationStatus(conversationId, conversation) {
  if (!io) return;
  io.to(`conv_${conversationId}`).emit("conversation_status_changed", conversation);
  io.to("admin_room").emit("admin_conversation_update", { conversation });
}

// Helper to broadcast support availability changes
function broadcastSupportConfig(config) {
  if (!io) return;
  io.emit("support_status_changed", config);
}

module.exports = {
  initSocket,
  getIO,
  broadcastNewMessage,
  broadcastConversationStatus,
  broadcastSupportConfig
};
