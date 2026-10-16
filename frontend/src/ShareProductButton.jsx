import React, { useState, useRef, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  Smartphone,
  ExternalLink,
  Link as LinkIcon
} from "lucide-react";

// Social Media Brand SVGs
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.476-.15-.676.15-.201.3-.777.979-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.799-1.498-1.786-1.674-2.087-.175-.3-.019-.462.132-.612.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.632-.928-2.235-.245-.589-.494-.509-.677-.518-.175-.008-.376-.01-.577-.01-.201 0-.527.075-.802.376s-1.054 1.03-1.054 2.512 1.079 2.912 1.23 3.113c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.634.721.23 1.378.197 1.897.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.076-.126-.277-.201-.578-.352zM12.04 2C6.545 2 2.08 6.464 2.08 11.96c0 1.954.568 3.78 1.554 5.325L2 22l4.872-1.597a9.92 9.92 0 0 0 5.168 1.456c5.495 0 9.96-4.464 9.96-9.96 0-5.495-4.465-9.96-9.96-9.96zm0 18.232a8.27 8.27 0 0 1-4.223-1.157l-.303-.18-2.888.946.963-2.813-.198-.314a8.275 8.275 0 0 1-1.271-4.754c0-4.57 3.719-8.289 8.29-8.289 4.57 0 8.288 3.719 8.288 8.289 0 4.57-3.718 8.288-8.289 8.288z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}

export default function ShareProductButton({
  product,
  showToast,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isManualCopy, setIsManualCopy] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Compute dynamic absolute URL for current product
  const getShareUrl = () => {
    if (!product) {
      return typeof window !== "undefined" ? window.location.href : "";
    }
    const id = product._id || product.productId || "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/products/${encodeURIComponent(id)}`;
  };

  const shareUrl = getShareUrl();
  const productName = product?.name || "TechZone Product";
  const productPrice = product?.price ? Number(product.price) : 0;
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Copy product link to clipboard with fallback
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for environments where Clipboard API is restricted
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!successful) throw new Error("execCommand failed");
      }

      setCopied(true);
      setIsManualCopy(false);
      if (showToast) {
        showToast(
          "Link Copied!",
          "Product link copied to clipboard successfully!",
          "share-copy",
          "🔗"
        );
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Clipboard copy failed, enabling manual copy fallback:", err);
      setIsManualCopy(true);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
      if (showToast) {
        showToast(
          "Copy Notice",
          "Please copy the product link manually from the input field",
          "info",
          "📋"
        );
      }
    }
  };

  // Social Sharing Handlers
  const handleSocialShare = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedName = encodeURIComponent(productName);
    const encodedMessage = encodeURIComponent(
      `Check out ${productName} on TechZone!\n${shareUrl}`
    );

    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodedMessage}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
          `Check out ${productName} on TechZone!`
        )}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "email":
        url = `mailto:?subject=${encodedName}&body=${encodeURIComponent(
          `Hi,\n\nI thought you might like this on TechZone:\n\n${productName}\nPrice: ₹${productPrice.toLocaleString(
            "en-IN"
          )}\n\nView here: ${shareUrl}\n\nHappy Shopping!`
        )}`;
        break;
      default:
        return;
    }

    if (platform === "email") {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Web Share API for Mobile Devices
  const handleNativeShare = async () => {
    if (!canNativeShare) return;

    try {
      await navigator.share({
        title: productName,
        text: `Check out ${productName} on TechZone!`,
        url: shareUrl
      });
      if (showToast) {
        showToast("Shared!", "Product shared successfully", "share-copy", "🚀");
      }
      setIsOpen(false);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Web Share API error:", err);
      }
    }
  };

  return (
    <>
      {/* Trigger Button: Styled beside Add to Wishlist */}
      <button
        type="button"
        className={`detailShareBtn ${className}`}
        onClick={() => setIsOpen(true)}
        title="Share Product"
        aria-label="Share Product"
        id="detail-share-product-btn"
      >
        <Share2 size={18} />
        <span>Share</span>
      </button>

      {/* Share Modal Popup */}
      {isOpen && (
        <div
          className="share-modal-overlay"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className="share-modal-card"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            {/* Modal Header */}
            <div className="share-modal-header">
              <div className="share-modal-title-wrap">
                <div className="share-badge-icon">
                  <Share2 size={16} />
                </div>
                <div>
                  <h3 id="share-modal-title" className="share-modal-title">
                    Share Product
                  </h3>
                  <p className="share-modal-subtitle">
                    Share this product with friends or copy the link
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="share-modal-close"
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close share dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Product Summary Snippet */}
            {product && (
              <div className="share-product-preview">
                {product.image && (
                  <img
                    src={product.image}
                    alt={productName}
                    className="share-preview-thumb"
                  />
                )}
                <div className="share-preview-info">
                  <h4 className="share-preview-name">{productName}</h4>
                  <div className="share-preview-meta">
                    <span className="share-preview-price">
                      ₹{productPrice.toLocaleString("en-IN")}
                    </span>
                    {product.discount > 0 && (
                      <span className="share-preview-discount">
                        {product.discount}% OFF
                      </span>
                    )}
                    {product.category && (
                      <span className="share-preview-category">
                        {product.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Copy Product Link Box */}
            <div className="share-link-section">
              <label htmlFor="share-product-url-input" className="share-section-label">
                <LinkIcon size={14} />
                <span>Product Link</span>
              </label>
              <div className="share-link-input-group">
                <input
                  id="share-product-url-input"
                  ref={inputRef}
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => e.target.select()}
                  className={`share-url-input ${isManualCopy ? "manual-focus" : ""}`}
                />
                <button
                  type="button"
                  className={`share-copy-btn ${copied ? "copied" : ""}`}
                  onClick={handleCopy}
                  title="Copy link to clipboard"
                  id="share-copy-link-btn"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              {isManualCopy && (
                <p className="share-manual-hint">
                  Press <strong>Ctrl+C</strong> (or <strong>Cmd+C</strong>) to copy the highlighted link.
                </p>
              )}
            </div>

            {/* Social Media Sharing Channels */}
            <div className="share-social-section">
              <span className="share-section-label">Share to Social Media</span>
              <div className="share-social-grid">
                {/* WhatsApp */}
                <button
                  type="button"
                  className="share-social-btn whatsapp-btn"
                  onClick={() => handleSocialShare("whatsapp")}
                  title="Share on WhatsApp"
                  id="share-whatsapp-btn"
                >
                  <span className="social-icon-circle whatsapp-circle">
                    <WhatsAppIcon />
                  </span>
                  <span className="social-label">WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  className="share-social-btn telegram-btn"
                  onClick={() => handleSocialShare("telegram")}
                  title="Share on Telegram"
                  id="share-telegram-btn"
                >
                  <span className="social-icon-circle telegram-circle">
                    <TelegramIcon />
                  </span>
                  <span className="social-label">Telegram</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  className="share-social-btn facebook-btn"
                  onClick={() => handleSocialShare("facebook")}
                  title="Share on Facebook"
                  id="share-facebook-btn"
                >
                  <span className="social-icon-circle facebook-circle">
                    <FacebookIcon />
                  </span>
                  <span className="social-label">Facebook</span>
                </button>

                {/* Email */}
                <button
                  type="button"
                  className="share-social-btn email-btn"
                  onClick={() => handleSocialShare("email")}
                  title="Share via Email"
                  id="share-email-btn"
                >
                  <span className="social-icon-circle email-circle">
                    <EmailIcon />
                  </span>
                  <span className="social-label">Email</span>
                </button>

                {/* Web Share API (if supported) */}
                {canNativeShare && (
                  <button
                    type="button"
                    className="share-social-btn native-btn"
                    onClick={handleNativeShare}
                    title="Share via Device Apps"
                    id="share-native-device-btn"
                  >
                    <span className="social-icon-circle native-circle">
                      <Smartphone size={18} />
                    </span>
                    <span className="social-label">Device Share</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="share-modal-footer">
              <span className="share-footer-domain">
                Link: <strong>{shareUrl.replace(/^https?:\/\//, "")}</strong>
              </span>
              <button
                type="button"
                className="share-footer-close-btn"
                onClick={() => setIsOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
