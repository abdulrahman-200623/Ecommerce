function goPath(path){window.history.pushState({},"",path);window.dispatchEvent(new PopStateEvent("popstate"))}
function pathKey(){const p=window.location.pathname; if(p.startsWith('/products/')) return 'product-detail'; if(p==='/products') return 'products'; if(p==='/features') return 'features'; if(p==='/enterprise') return 'enterprise'; if(p==='/support') return 'support'; if(p==='/pricing') return 'pricing'; if(p==='/cart') return 'cart'; return 'home'}

function Header({count}){
  const nav=(key)=>goPath(key==='home'?'/':'/'+key);
  return <header className="topbar">
    <button className="mark" onClick={()=>nav('home')} aria-label="TechZone home"><Globe2 size={27}/></button>
    <nav className="mainnav">
      <button onClick={()=>nav('home')}>Home</button>
      <button onClick={()=>nav('products')}>Product</button>
      <button onClick={()=>nav('features')}>Features</button>
      <button onClick={()=>nav('enterprise')}>Enterprise</button>
      <button onClick={()=>nav('support')}>Support</button>
      <button onClick={()=>nav('pricing')}>Pricing</button>
    </nav>
    <button className="cartIcon" onClick={()=>nav('cart')} aria-label="Open cart"><ShoppingCart size={27}/><span>{count}</span></button>
  </header>
}

function Card({p,add,onOpen}){
  return <article className="card" onClick={()=>onOpen(p)}>
    <b className="discount">{p.discount}% OFF</b>
    <button className="heart" onClick={e=>e.stopPropagation()}><Heart size={19}/></button>
    <div className="pic"><img src={p.image} alt={p.name}/></div>
    <div className="rating"><Star size={13} fill="#f4a300"/> {p.rating} <span>({p.reviews})</span></div>
    <h3>{p.name}</h3><p>{p.description}</p>
    <div className="price"><strong>₹{p.price.toLocaleString("en-IN")}</strong><del>₹{p.originalPrice.toLocaleString("en-IN")}</del><b>{p.discount}% off</b></div>
    <div className="delivery"><Truck size={14}/> Free Delivery <span>In Stock</span></div>
    <button className="add" onClick={e=>{e.stopPropagation();add(p)}}><ShoppingCart size={16}/>Add to Cart</button>
    <div className="viewHint">Click to view details</div>
  </article>
}

function ProductDetail({product,products,add}){
  if(!product) return <section className="page"><div className="emptyPage"><h1>Product not found</h1><button className="primaryBtn" onClick={()=>goPath('/products')}>Back to Products</button></div></section>;
  const related=products.filter(p=>p.category===product.category&&p._id!==product._id).slice(0,5);
  return <main className="page productPage">
    <button className="backBtn" onClick={()=>goPath('/products')}>← Back to Products</button>
    <section className="productDetail fullDetail">
      <div className="detailImage"><img src={product.image} alt={product.name}/></div>
      <div className="detailInfo"><span className="detailCat">{product.category}</span><h1>{product.name}</h1>
        <div className="detailRating"><Star size={16} fill="#f4a300"/> {product.rating} ({product.reviews} reviews)</div>
        <p>{product.description}</p>
        <div className="detailPrice">₹{product.price.toLocaleString("en-IN")} <del>₹{product.originalPrice.toLocaleString("en-IN")}</del> <b>{product.discount}% OFF</b></div>
        <div className="detailStock">✓ In Stock &nbsp; • &nbsp; Free Delivery &nbsp; • &nbsp; 7 Days Return</div>
        <div className="detailActions"><button className="detailAdd" onClick={()=>add(product)}><ShoppingCart size={18}/> Add to Cart</button><button className="buyBtn" onClick={()=>{add(product);goPath('/cart')}}>Buy Now <ArrowRight size={17}/></button></div>
      </div>
    </section>
    <section className="detailDescription"><span>PRODUCT DETAILS</span><h2>About this product</h2><p>{product.description}. Designed for everyday performance with reliable quality, modern features and a great user experience.</p></section>
    {related.length>0&&<section className="related"><h2>Related Products</h2><div className="grid">{related.map(p=><Card key={p._id} p={p} add={add} onOpen={x=>goPath('/products/'+encodeURIComponent(x._id))}/>)}</div></section>}
  </main>
}

function Products({add,initialCategory='All',products,setProducts}){
  const[q,setQ]=useState(""),[cat,setCat]=useState(initialCategory),[sort,setSort]=useState("Featured"),[page,setPage]=useState(1);
  const perPage=50;
  useEffect(()=>setCat(initialCategory),[initialCategory]);
  const cats=useMemo(()=>["All",...new Set(products.map(p=>p.category))],[products]);
  const list=useMemo(()=>{let x=products.filter(p=>(cat==="All"||p.category===cat)&&`${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase()));if(sort==="Price: Low to High")x.sort((a,b)=>a.price-b.price);if(sort==="Price: High to Low")x.sort((a,b)=>b.price-a.price);if(sort==="Rating")x.sort((a,b)=>b.rating-a.rating);return x},[products,q,cat,sort]);
  useEffect(()=>setPage(1),[q,cat,sort]);
  const total=Math.max(1,Math.ceil(list.length/perPage));
  const visible=list.slice((page-1)*perPage,page*perPage);
  const openProduct=p=>goPath('/products/'+encodeURIComponent(p._id));
  return <main className="page" id="products">
    <div className="title"><h1>{cat==='All'?'All Products':cat}</h1><p>Discover the best deals on latest electronics</p></div>
    <div className="filters"><div className="filter"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products..."/></div><div className="select"><select value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={16}/></div><div className="sort"><SlidersHorizontal size={16}/>Sort by:<select value={sort} onChange={e=>setSort(e.target.value)}><option>Featured</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Rating</option></select></div></div>
    <div className="resultCount">Showing {list.length?(page-1)*perPage+1:0}-{Math.min(page*perPage,list.length)} of {list.length} products</div>
    <div className="grid">{visible.map(p=><Card key={p._id} p={p} add={add} onOpen={openProduct}/>)}</div>
    <div className="pages"><button disabled={page===1} onClick={()=>{setPage(page-1);window.scrollTo({top:0,behavior:'smooth'})}}>‹</button>{Array.from({length:total},(_,i)=>i+1).map(n=><button key={n} className={page===n?'on':''} onClick={()=>{setPage(n);window.scrollTo({top:0,behavior:'smooth'})}}>{n}</button>)}<button disabled={page===total} onClick={()=>{setPage(page+1);window.scrollTo({top:0,behavior:'smooth'})}}>›</button></div>
  </main>
}

function CartPage({items,onRemove,onAdd}){
  const total=items.reduce((s,x)=>s+x.price*x.qty,0);
  return <main className="page cartPage"><div className="title"><h1>Shopping Cart</h1><p>Review your products and continue to checkout.</p></div>{items.length===0?<div className="emptyPage"><ShoppingCart size={55}/><h2>Your cart is empty</h2><button className="primaryBtn" onClick={()=>goPath('/products')}>Continue Shopping</button></div>:<div className="cartLayout"><div className="cartList">{items.map(x=><div className="cartRow" key={x._id}><img src={x.image} alt={x.name}/><div><h3>{x.name}</h3><p>{x.description}</p><strong>₹{x.price.toLocaleString('en-IN')}</strong><div className="qty"><button onClick={()=>onRemove(x._id)}>−</button><span>{x.qty}</span><button onClick={()=>onAdd(x)}>+</button></div></div></div>)}</div><aside className="summary"><h2>Price Details</h2><div><span>Items</span><span>{items.reduce((s,x)=>s+x.qty,0)}</span></div><div><span>Total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><button className="checkoutBtn" onClick={()=>alert('Checkout page ready — connect your order API here.')}>Proceed to Checkout</button></aside></div>}</main>
}

function InfoPage({type}){
 const data={features:['Features','Smart shopping features for your complete tech journey.',['Search & Filters','5 product pages','Related products','Fast cart experience']],enterprise:['Enterprise','TechZone solutions for teams, businesses and growing digital stores.',['Bulk product management','Business-ready catalog','Reliable checkout flow','Scalable MERN architecture']],support:['Support','Need help? TechZone keeps support simple and accessible.',['Secure checkout','Delivery assistance','Easy returns','Product support']],pricing:['Pricing','Simple shopping with competitive prices and offers across every category.',['Daily deals','Member offers','Transparent pricing','No hidden charges']]}[type];
 return <main className="page infoPage"><div className="infoHero"><span>TECHZONE</span><h1>{data[0]}</h1><p>{data[1]}</p><button className="primaryBtn" onClick={()=>goPath('/products')}>Explore Products <ArrowRight size={17}/></button></div><div className="infoCards">{data[2].map((x,i)=><div key={x}><b>0{i+1}</b><h2>{x}</h2><p>Built into the TechZone shopping experience.</p></div>)}</div></main>
}

function Home({add}){
 return <>
  <section className="hero" id="home">
   <div className="heroProduct phoneHero"><img src={demo[0].image} alt="TechZone mobile"/></div>
   <div className="heroContent"><span className="heroEyebrow">LATEST TECH · BEST PRICES</span><h1>Upgrade Your<br/><span>Tech Life</span></h1><p>Discover the latest mobiles, headphones, laptops and accessories from top brands.</p><div className="heroLinks"><button className="shopBtn" onClick={()=>goPath('/products')}>Shop Now <ArrowRight size={18}/></button><button onClick={()=>goPath('/features')}>Explore categories <ArrowRight size={17}/></button></div></div>
   <div className="heroProduct headphoneHero"><img src={demo[2].image} alt="TechZone headphones"/></div><div className="heroMini earbudsHero"><img src={demo[5].image} alt="TechZone earbuds"/></div><div className="heroMini watchHero"><img src={demo[3].image} alt="TechZone smartwatch"/></div>
  </section>
  <section className="featureStrip"><div><span>01</span><h2>Mobiles</h2><p>Latest smartphones with powerful performance.</p><button onClick={()=>goPath('/products?category=Mobiles')}>Shop Now →</button><img src={demo[4].image} alt="Mobiles"/></div><div><span>02</span><h2>Headphones</h2><p>Feel the sound like never before.</p><button onClick={()=>goPath('/products?category=Headphones')}>Shop Now →</button><img src={demo[2].image} alt="Headphones"/></div><div><span>03</span><h2>Laptops</h2><p>Power for your big ideas.</p><button onClick={()=>goPath('/products?category=Laptops')}>Shop Now →</button><img src={demo[1].image} alt="Laptop"/></div><div><span>04</span><h2>Accessories</h2><p>Smart add-ons. Big difference.</p><button onClick={()=>goPath('/products?category=Accessories')}>Shop Now →</button><img src={demo[3].image} alt="Accessories"/></div></section>
  <section className="homeIntro"><span>TECHZONE FOR EVERYONE</span><h2>Everything you need for your digital life.</h2><p>Shop trusted electronics, compare products, add to cart and move from browsing to checkout without leaving the experience.</p><button className="primaryBtn" onClick={()=>goPath('/products')}>Explore Products <ArrowRight size={17}/></button></section>
 </>
}

function Footer(){return <footer className="footer"><div className="footerGrid"><div><h3>Tech<span>Zone</span></h3><p>Your trusted destination for mobiles, laptops, audio, accessories and more.</p></div><div><h4>Shop</h4><button onClick={()=>goPath('/products')}>All Products</button><button onClick={()=>goPath('/cart')}>Shopping Cart</button></div><div><h4>Explore</h4><button onClick={()=>goPath('/features')}>Features</button><button onClick={()=>goPath('/enterprise')}>Enterprise</button></div><div><h4>Support</h4><button onClick={()=>goPath('/support')}>Customer Support</button><button onClick={()=>goPath('/pricing')}>Pricing</button></div></div><div className="footerBottom">© 2026 TechZone • Full MERN E-Commerce • React + Node.js + Express + MongoDB</div></footer>}

function App(){
 const[cart,setCart]=useState([]),[route,setRoute]=useState(pathKey()),[products,setProducts]=useState(demo);
 useEffect(()=>{const onPop=()=>setRoute(pathKey());window.addEventListener('popstate',onPop);axios.get('http://localhost:5000/api/products').then(r=>{if(r.data?.length){const base=Array.from({length:50},(_,i)=>r.data[i%r.data.length]);const all=Array.from({length:5},(_,pg)=>base.map((p,i)=>({...p,_id:`${pg+1}-${i+1}`,name:pg===0?p.name:`${p.name} ${pg+1}`}))).flat();setProducts(all)}}).catch(()=>{});return()=>window.removeEventListener('popstate',onPop)},[]);
 const add=p=>setCart(c=>c.some(x=>x._id===p._id)?c.map(x=>x._id===p._id?{...x,qty:x.qty+1}:x):[...c,{...p,qty:1}]);
 const remove=id=>setCart(c=>c.map(x=>x._id===id?{...x,qty:x.qty-1}:x).filter(x=>x.qty>0));
 const currentId=decodeURIComponent(window.location.pathname.split('/').pop()||'');
 const selected=products.find(p=>String(p._id)===currentId);
 let content;
 if(route==='home')content=<Home add={add}/>;
 else if(route==='products')content=<Products add={add} products={products} setProducts={setProducts} initialCategory={new URLSearchParams(window.location.search).get('category')||'All'}/>;
 else if(route==='product-detail')content=<ProductDetail product={selected} products={products} add={add}/>;
 else if(route==='cart')content=<CartPage items={cart} onRemove={remove} onAdd={add}/>;
 else content=<InfoPage type={route}/>;
 return <><Header count={cart.reduce((s,x)=>s+x.qty,0)}/>{content}<Footer/></>
}
createRoot(document.getElementById("root")).render(<BrowserRouter><App/></BrowserRouter>);
