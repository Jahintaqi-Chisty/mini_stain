import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import "./App.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_CREDS = { username: "admin", password: "ministain2025" };
const DHAKA_AREAS = ["Dhaka","Gazipur","Narayanganj","Manikganj","Narsingdi","Munshiganj"];
const DISTRICTS = ["Dhaka","Gazipur","Narayanganj","Manikganj","Narsingdi","Munshiganj","Chittagong","Rajshahi","Khulna","Sylhet","Barisal","Rangpur","Mymensingh","Comilla","Cox's Bazar","Noakhali","Feni","Lakshmipur","Chandpur","Brahmanbaria","Bogura","Pabna","Sirajganj","Natore","Naogaon","Jessore","Satkhira","Bagerhat","Meherpur","Chuadanga","Jhenaidah","Faridpur","Madaripur","Shariatpur","Rajbari","Gopalganj","Tangail","Kishoreganj","Netrokona","Jamalpur","Sherpur","Sunamganj","Habiganj","Moulvibazar","Patuakhali","Pirojpur","Jhalokati","Bhola","Barguna","Kurigram","Lalmonirhat","Nilphamari","Panchagarh","Thakurgaon","Dinajpur","Joypurhat","Gaibandha","Kushtia"];
const FALLBACK_IMG_600 = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600";
const FALLBACK_IMG_200 = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200";
const attrColor = (value="")=>{
  const v=String(value).toLowerCase();
  if(v.includes("silver"))return "#C0C0C0";
  if(v.includes("gold"))return "#D4AF37";
  if(v.includes("rose"))return "#B76E79";
  if(v.includes("black"))return "#2A2A2A";
  if(v.includes("white"))return "#F5F5F5";
  if(v.includes("blue"))return "#5B8DD9";
  if(v.includes("green"))return "#5AB88A";
  if(v.includes("red"))return "#D95B5B";
  if(v.includes("pink"))return "#E8A1B5";
  if(v.includes("gray")||v.includes("grey"))return "#7A7A7A";
  return "";
};
const INITIAL_PROMOS = [];
const INIT_PRODUCTS = [];
const THEMES = [
  {
    id: "atelier",
    label: "Atelier Serif",
    desc: "Editorial warmth, soft luxury",
    preview: { bg: "#F6F1E9", surface: "#F1E6DA", accent: "#B17646", accent2: "#D9A072" },
    vars: {
      "--bg": "#F6F1E9",
      "--s": "#FFF8F0",
      "--s2": "#F1E6DA",
      "--s3": "#E9DCCE",
      "--b": "rgba(34,26,20,.08)",
      "--b2": "rgba(34,26,20,.14)",
      "--g": "#B17646",
      "--g2": "#D9A072",
      "--t": "#2C2620",
      "--m": "#7A6E66",
      "--m2": "#5F554E",
      "--red": "#C55C5C",
      "--grn": "#3B9F7A",
      "--blu": "#4B7DA6",
      "--g-soft": "rgba(177,118,70,.08)",
      "--g-soft2": "rgba(177,118,70,.22)",
      "--g-shadow": "rgba(177,118,70,.32)",
      "--r": "14px",
      "--r2": "22px",
      "--fd": "'Fraunces', serif",
      "--fb": "'Plus Jakarta Sans', sans-serif",
      "--sh": "0 18px 48px rgba(34,26,20,.18)",
    },
  },
  {
    id: "night",
    label: "Night Market",
    desc: "Bold contrast, neon accents",
    preview: { bg: "#0A0F17", surface: "#111824", accent: "#FF8A3D", accent2: "#FFC285" },
    vars: {
      "--bg": "#0A0F17",
      "--s": "#0F1622",
      "--s2": "#111824",
      "--s3": "#172231",
      "--b": "rgba(255,255,255,.08)",
      "--b2": "rgba(255,255,255,.16)",
      "--g": "#FF8A3D",
      "--g2": "#FFC285",
      "--t": "#E9EEF6",
      "--m": "#7A8798",
      "--m2": "#596576",
      "--red": "#FF6B6B",
      "--grn": "#3CD6A4",
      "--blu": "#4CB2FF",
      "--g-soft": "rgba(255,138,61,.12)",
      "--g-soft2": "rgba(255,138,61,.26)",
      "--g-shadow": "rgba(255,138,61,.38)",
      "--r": "8px",
      "--r2": "14px",
      "--fd": "'Space Grotesk', sans-serif",
      "--fb": "'Sora', sans-serif",
      "--sh": "0 22px 70px rgba(0,0,0,.55)",
    },
  },
];

function applyThemeVars(themeId) {
  if (typeof document === "undefined") return THEMES[0];
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.dataset.theme = theme.id;
  return theme;
}

function getProductIdFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get("product");
  } catch {
    return null;
  }
}

function updateProductInUrl(productId, { replace = false } = {}) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (productId) url.searchParams.set("product", productId);
  else url.searchParams.delete("product");
  if (replace) window.history.replaceState({}, "", url.toString());
  else window.history.pushState({}, "", url.toString());
}

const fmt=n=>"৳"+Number(n).toLocaleString("en-BD");
const genId=()=>"MS-"+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,5).toUpperCase();
const isDhaka=d=>DHAKA_AREAS.includes(d);
const shipFee=(d,cp)=>cp?.type==="freeship"?0:isDhaka(d)?80:120;

// ─── Optional Sync (Odoo via Vercel API) ────────────────────────────────────
// Keep Odoo credentials on the serverless side (Vercel env). The frontend
// only talks to /api/odoo/* endpoints on the same origin.
const SYNC_CONFIG = {
  ordersEnabled: true,   // manual sync only (button press)
  productsEnabled: true, // pull from Odoo
  promosEnabled: true,   // pull from Odoo
  settingsEnabled: true, // global settings (theme)
  baseUrl: "",           // same origin on Vercel
  endpoints: {
    orderSync: "/api/odoo/order",      // POST order payload
    ordersPull: "/api/odoo/orders",    // GET orders from Odoo
    productsPull: "/api/odoo/products", // GET products from Odoo
    promosPull: "/api/odoo/promotions", // GET promotions from Odoo
    settings: "/api/odoo/settings"      // GET/POST global settings
  },
};

async function apiJSON(path, options = {}) {
  const url = (SYNC_CONFIG.baseUrl || "") + path;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(data?.message || data?.error || `API error (${res.status})`);
  return data;
}

async function authJSON(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(data?.message || data?.error || `Auth error (${res.status})`);
  return data;
}

async function syncOrderToBackend(order) {
  if (!SYNC_CONFIG.ordersEnabled) return;
  return apiJSON(SYNC_CONFIG.endpoints.orderSync, {
    method: "POST",
    body: JSON.stringify(order),
  });
}

async function fetchOrdersFromOdoo() {
  if (!SYNC_CONFIG.ordersEnabled) return null;
  return apiJSON(SYNC_CONFIG.endpoints.ordersPull, { method: "GET" });
}

async function fetchProductsFromOdoo() {
  if (!SYNC_CONFIG.productsEnabled) return null;
  return apiJSON(SYNC_CONFIG.endpoints.productsPull, { method: "GET" });
}

async function fetchPromosFromOdoo() {
  if (!SYNC_CONFIG.promosEnabled) return null;
  return apiJSON(SYNC_CONFIG.endpoints.promosPull, { method: "GET" });
}

async function fetchSettingsFromOdoo() {
  if (!SYNC_CONFIG.settingsEnabled) return null;
  return apiJSON(SYNC_CONFIG.endpoints.settings, { method: "GET" });
}

async function saveSettingsToOdoo(settings) {
  if (!SYNC_CONFIG.settingsEnabled) return null;
  return apiJSON(SYNC_CONFIG.endpoints.settings, {
    method: "POST",
    body: JSON.stringify(settings || {}),
  });
}

const payLabel = (m) => (m === "cod" ? "COD" : m === "bkash" ? "bKash" : m === "nagad" ? "Nagad" : String(m || ""));
const payBadge = (m) => (m === "cod" ? "bpend" : m === "bkash" ? "bproc" : "bdel");
const isMobileMoney = (m) => m === "bkash" || m === "nagad";

function useLS(k,iv){
  const[v,set]=useState(()=>{try{const s=localStorage.getItem(k);return s?JSON.parse(s):iv;}catch{return iv;}});
  const fn=useCallback(x=>{set(p=>{const n=typeof x==="function"?x(p):x;try{localStorage.setItem(k,JSON.stringify(n));}catch{}return n;});},[k]);
  return[v,fn];
}

// Toast
function Toast({msg,icon="✦",onClose}){
  useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t);},[onClose]);
  return <div className="toast"><span>{icon}</span><span>{msg}</span></div>;
}

// Admin Login
function AdminLogin({onLogin}){
  const[u,setU]=useState("");const[p,setP]=useState("");const[err,setErr]=useState("");
  const sub=e=>{e.preventDefault();if(u===ADMIN_CREDS.username&&p===ADMIN_CREDS.password)onLogin();else setErr("Invalid username or password");};
  return(
    <div className="lgpage">
      <form className="lgcard" onSubmit={sub}>
        <div className="lglogo">MiniStain</div>
        <div className="lgsub">🔐 Admin Panel Login</div>
        {err&&<div className="lgerr">{err}</div>}
        <div className="fg"><label className="fl">Username</label><input className="fi" value={u} onChange={e=>setU(e.target.value)} placeholder="admin" autoComplete="username"/></div>
        <div className="fg"><label className="fl">Password</label><input className="fi" type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="••••••••" autoComplete="current-password"/></div>
        <button className="lgbtn" type="submit">Login to Admin Panel</button>
        <div className="lgft">Default: admin / ministain2025</div>
      </form>
    </div>
  );
}

// Customer Account
function AccountPage({customer,onAuth,onLogout}){
  const[mode,setMode]=useState(customer?"profile":"login");
  const[form,setForm]=useState({firstName:"",lastName:"",phone:"",email:"",password:"",confirm:""});
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);
  const[orders,setOrders]=useState([]);
  const[ordersLoading,setOrdersLoading]=useState(false);
  const ch=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  useEffect(()=>{setMode(customer?"profile":"login");},[customer]);
  useEffect(()=>{
    if(!customer) return;
    setOrdersLoading(true);
    authJSON("/api/orders/my",{method:"GET"})
      .then(data=>setOrders(Array.isArray(data?.orders)?data.orders:[]))
      .catch(()=>setOrders([]))
      .finally(()=>setOrdersLoading(false));
  },[customer]);

  const submitLogin=async e=>{
    e.preventDefault();setErr("");
    if(!form.email||!form.password){setErr("Email and password required");return;}
    setLoading(true);
    try{
      const data=await authJSON("/api/auth/login",{method:"POST",body:JSON.stringify({email:form.email,password:form.password})});
      if(data?.user) onAuth(data.user);
      setMode("profile");
      setForm(f=>({...f,password:"",confirm:""}));
    }catch(e){
      setErr(e?.message||"Login failed");
    }finally{setLoading(false);}
  };

  const submitRegister=async e=>{
    e.preventDefault();setErr("");
    if(!form.firstName||!form.lastName){setErr("Name required");return;}
    if(!form.email||!form.password){setErr("Email and password required");return;}
    if(form.password.length<6){setErr("Password must be at least 6 characters");return;}
    if(form.password!==form.confirm){setErr("Passwords do not match");return;}
    setLoading(true);
    try{
      const data=await authJSON("/api/auth/register",{method:"POST",body:JSON.stringify({
        firstName:form.firstName,
        lastName:form.lastName,
        phone:form.phone,
        email:form.email,
        password:form.password,
      })});
      if(data?.user) onAuth(data.user);
      setMode("profile");
      setForm(f=>({...f,password:"",confirm:""}));
    }catch(e){
      setErr(e?.message||"Registration failed");
    }finally{setLoading(false);}
  };

  if(customer&&mode==="profile"){
    return(
      <div className="accpage">
        <div className="acchd">My Account</div>
        <div className="accsub">Welcome back, {customer.firstName||customer.email}</div>
        <div className="accgrid">
          <div className="acccard">
            <div className="acctitle">Profile</div>
            <div className="accrow"><span>Name</span><span>{[customer.firstName,customer.lastName].filter(Boolean).join(" ")||"—"}</span></div>
            <div className="accrow"><span>Email</span><span>{customer.email||"—"}</span></div>
            <div className="accrow"><span>Phone</span><span>{customer.phone||"—"}</span></div>
          </div>
          <div className="acccard">
            <div className="acctitle">Saved Addresses</div>
            <div className="accnote">Coming soon</div>
          </div>
          <div className="acccard">
            <div className="acctitle">Order History</div>
            {ordersLoading
              ?<div className="accnote">Loading orders...</div>
              :orders.length===0
                ?<div className="accnote">No orders yet</div>
                :<div className="orderlist">
                  {orders.slice(0,4).map(o=>{
                    const when=o.createdAt?new Date(o.createdAt):null;
                    const itemCount=Array.isArray(o.items)?o.items.reduce((s,i)=>s+(i.qty||0),0):0;
                    const statusKey=String(o.status||"pending").toLowerCase().replace(/[^a-z0-9]+/g,"-");
                    return(
                      <div key={o.id} className="orderitem">
                        <div className="orderrow">
                          <div className="orderid">{o.orderId||"Order"}</div>
                          <div className={`orderstatus st-${statusKey}`}>{o.status||"Pending"}</div>
                        </div>
                        <div className="orderrow">
                          <div className="orderdate">{when?when.toLocaleDateString("en-BD"): "—"}</div>
                          <div className="ordertotal">{fmt(o.total||0)}</div>
                        </div>
                        <div className="orderrow">
                          <div className="orderitems">{itemCount} items</div>
                          {o.odooOrderId&&<div className="orderodoo">Odoo #{o.odooOrderId}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>}
          </div>
        </div>
        <button className="bgh bsm" onClick={onLogout}>Sign out</button>
      </div>
    );
  }

  return(
    <div className="lgpage">
      <form className="lgcard" onSubmit={mode==="login"?submitLogin:submitRegister}>
        <div className="lglogo">MiniStain</div>
        <div className="lgsub">{mode==="login"?"Customer Login":"Create Account"}</div>
        {err&&<div className="lgerr">{err}</div>}
        {mode==="register"&&(
          <div className="frow">
            <div className="fg"><label className="fl">First Name *</label><input className="fi" value={form.firstName} onChange={ch("firstName")} placeholder="Rahim"/></div>
            <div className="fg"><label className="fl">Last Name *</label><input className="fi" value={form.lastName} onChange={ch("lastName")} placeholder="Uddin"/></div>
          </div>
        )}
        {mode==="register"&&<div className="fg"><label className="fl">Phone (optional)</label><input className="fi" value={form.phone} onChange={ch("phone")} placeholder="01XXXXXXXXX"/></div>}
        <div className="fg"><label className="fl">Email *</label><input className="fi" type="email" value={form.email} onChange={ch("email")} placeholder="email@example.com"/></div>
        <div className="fg"><label className="fl">Password *</label><input className="fi" type="password" value={form.password} onChange={ch("password")} placeholder="••••••••"/></div>
        {mode==="register"&&<div className="fg"><label className="fl">Confirm Password *</label><input className="fi" type="password" value={form.confirm} onChange={ch("confirm")} placeholder="••••••••"/></div>}
        <button className="lgbtn" type="submit" disabled={loading}>{loading?"Please wait...":mode==="login"?"Login":"Create Account"}</button>
        <div className="authswitch">
          {mode==="login"?"New here? ":"Already have an account? "}
          <button type="button" onClick={()=>{setErr("");setMode(mode==="login"?"register":"login");}}>
            {mode==="login"?"Create account":"Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Image Upload Slots
function ImgUpload({images,onChange}){
  const ref=useRef();const[si,setSi]=useState(null);
  const slots=[...images,...Array(Math.max(0,3-images.length)).fill(null)].slice(0,6);
  const onFile=e=>{
    const files=Array.from(e.target.files);
    const readers=files.map(f=>new Promise(res=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.readAsDataURL(f);}));
    Promise.all(readers).then(res=>{
      const upd=[...images];
      res.forEach((img,i)=>{const idx=si!==null?si+i:upd.length+i;if(idx<6)upd[idx]=img;});
      onChange(upd.slice(0,6));
    });e.target.value="";
  };
  return(
    <>
      <input ref={ref} type="file" accept="image/*" multiple style={{display:"none"}} onChange={onFile}/>
      <div className="iugrid">
        {slots.map((img,i)=>(
          <div key={i} className="iuslot" onClick={()=>{if(!img){setSi(i);ref.current.click();}}}>
            {img?(<><img src={img} alt="" loading="lazy"/><div className="iurm" onClick={e=>{e.stopPropagation();const u=[...images];u.splice(i,1);onChange(u);}}>✕</div></>)
              :<div className="iuadd"><span>＋</span>Upload</div>}
          </div>
        ))}
      </div>
    </>
  );
}

// Product Modal
function ProdModal({product,onSave,onClose}){
  const blank={name:"",category:"Rings",price:"",originalPrice:"",stock:"",description:"",sizes:[],tags:[],salePercent:0,variants:[{label:"Silver",color:"#C0C0C0",images:[]}],odooProductId:null,syncedAt:null,syncError:null};
  const[form,setForm]=useState(product?{...product}:blank);
  const[vi,setVi]=useState(0);
  const ch=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const setVI=imgs=>setForm(f=>{const v=[...f.variants];v[vi]={...v[vi],images:imgs};return{...f,variants:v};});
  const addVar=()=>setForm(f=>({...f,variants:[...f.variants,{label:"New",color:"#888888",images:[]}]}));
  const rmVar=i=>setForm(f=>({...f,variants:f.variants.filter((_,x)=>x!==i)}));
  return(
    <div className="mov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox">
        <div className="mhd"><div className="mtitle">{product?"Edit Product":"Add New Product"}</div><button className="xbtn" onClick={onClose}>✕</button></div>
        <div className="mbody">
          <div className="frow"><div className="fg"><label className="fl">Product Name *</label><input className="fi" value={form.name} onChange={ch("name")} placeholder="Ring name..."/></div>
            <div className="fg"><label className="fl">Category</label><select className="fi" value={form.category} onChange={ch("category")}>{["Rings","Necklaces","Bracelets","Earrings"].map(c=><option key={c}>{c}</option>)}</select></div></div>
          <div className="frow">
            <div className="fg"><label className="fl">Sale Price (৳) *</label><input className="fi" type="number" value={form.price} onChange={ch("price")}/></div>
            <div className="fg"><label className="fl">Original Price (৳)</label><input className="fi" type="number" value={form.originalPrice} onChange={ch("originalPrice")}/></div></div>
          <div className="frow">
            <div className="fg"><label className="fl">Stock</label><input className="fi" type="number" value={form.stock} onChange={ch("stock")}/></div>
            <div className="fg"><label className="fl">Sale Discount % (0=none)</label><input className="fi" type="number" min="0" max="99" value={form.salePercent} onChange={ch("salePercent")}/></div></div>
          <div className="fg"><label className="fl">Description</label><textarea className="fi" rows={3} value={form.description} onChange={ch("description")} style={{resize:"vertical"}}/></div>
          <div className="fg"><label className="fl">Ring Sizes (comma separated, e.g. 5,6,7,8)</label><input className="fi" value={form.sizes.join(",")} onChange={e=>setForm(f=>({...f,sizes:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}))} placeholder="Leave blank if not a ring"/></div>
          <div className="fg">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <label className="fl" style={{marginBottom:0}}>Variants & Product Images</label>
              <button className="bsuc" onClick={addVar}>+ Add Variant</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {form.variants.map((v,i)=>(
                <button key={i} className={`vbtn ${vi===i?"on":""}`} onClick={()=>setVi(i)}>
                  <span className="vdlg" style={{background:v.color}}/>
                  {v.label}
                  {form.variants.length>1&&<span onClick={e=>{e.stopPropagation();rmVar(i);if(vi>=form.variants.length-1)setVi(0);}} style={{color:"var(--red)",marginLeft:4,fontSize:".8rem"}}>✕</span>}
                </button>
              ))}
            </div>
            <div className="frow">
              <div className="fg"><label className="fl">Label</label><input className="fi" value={form.variants[vi]?.label||""} onChange={e=>{const v=[...form.variants];v[vi]={...v[vi],label:e.target.value};setForm(f=>({...f,variants:v}));}}/></div>
              <div className="fg"><label className="fl">Color</label><input type="color" className="fi" style={{height:42,padding:4}} value={form.variants[vi]?.color||"#888"} onChange={e=>{const v=[...form.variants];v[vi]={...v[vi],color:e.target.value};setForm(f=>({...f,variants:v}));}}/></div>
            </div>
            <label className="fl">Images (click slot to upload from device)</label>
            <ImgUpload images={form.variants[vi]?.images||[]} onChange={setVI}/>
          </div>
        </div>
        <div className="mft">
          <button className="bgh bsm" onClick={onClose}>Cancel</button>
          <button className="bg bsm" onClick={()=>{
            if(!form.name||!form.price)return;
            const odooProductId=product?.odooProductId||null;
            onSave({
              ...form,
              price:+form.price,
              originalPrice:+form.originalPrice||+form.price,
              stock:+form.stock||0,
              salePercent:+form.salePercent||0,
              id:product?.id||Date.now(),
              odooProductId,
              syncedAt:null,
              syncError:null
            });
          }}>Save Product</button>
        </div>
      </div>
    </div>
  );
}

// Promo Modal
function PromoModal({promo,onSave,onClose}){
  const blank={code:"",type:"percent",value:"",minOrder:"",active:true,label:""};
  const[form,setForm]=useState(promo||blank);
  const ch=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  return(
    <div className="mov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{maxWidth:440}}>
        <div className="mhd"><div className="mtitle">{promo?"Edit Promotion":"New Promotion"}</div><button className="xbtn" onClick={onClose}>✕</button></div>
        <div className="mbody">
          <div className="fg"><label className="fl">Promo Code *</label><input className="fi" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="e.g. SAVE10"/></div>
          <div className="fg"><label className="fl">Description</label><input className="fi" value={form.label} onChange={ch("label")} placeholder="10% Off Welcome Discount"/></div>
          <div className="frow">
            <div className="fg"><label className="fl">Type</label><select className="fi" value={form.type} onChange={ch("type")}><option value="percent">Percentage (%)</option><option value="flat">Flat Amount (৳)</option><option value="freeship">Free Shipping</option></select></div>
            {form.type!=="freeship"&&<div className="fg"><label className="fl">Value</label><input className="fi" type="number" value={form.value} onChange={ch("value")}/></div>}
          </div>
          <div className="fg"><label className="fl">Minimum Order (৳)</label><input className="fi" type="number" value={form.minOrder} onChange={ch("minOrder")} placeholder="0"/></div>
          <div className="fg"><label className="fl">Status</label><select className="fi" value={form.active?"on":"off"} onChange={e=>setForm(f=>({...f,active:e.target.value==="on"}))}><option value="on">Active</option><option value="off">Inactive</option></select></div>
        </div>
        <div className="mft">
          <button className="bgh bsm" onClick={onClose}>Cancel</button>
          <button className="bg bsm" onClick={()=>{if(!form.code)return;onSave({...form,value:+form.value,minOrder:+form.minOrder,id:promo?.id||Date.now()});}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// Navbar
function Navbar({page,setPage,cartCount,openCart,isAdmin,logoutAdmin,customer,logoutCustomer}){
  return(
    <nav className="nav">
      <div className="nlogo" onClick={()=>setPage("shop")}>MiniStain</div>
      <div className="nright">
        <button className={`nbtn ${page==="home"?"on":""}`} onClick={()=>setPage("home")}>Home</button>
        <button className={`nbtn ${page==="shop"?"on":""}`} onClick={()=>setPage("shop")}>Shop</button>
        <button className={`nbtn ${page==="account"?"on":""}`} onClick={()=>setPage("account")}>{customer?"Account":"Login"}</button>
        {customer&&<button className="nbtn" onClick={logoutCustomer}>Sign out</button>}
        {isAdmin
          ?<><button className={`nbtn ${page==="admin"?"on":""}`} onClick={()=>setPage("admin")}>Admin</button>
            <button className="nbtn" onClick={logoutAdmin}>Logout</button></>
          :<button className="nbtn" onClick={()=>setPage("adminlogin")}>Admin</button>}
        <button className="ncart" onClick={openCart}>🛍 Cart{cartCount>0&&<span className="nbadge">{cartCount}</span>}</button>
      </div>
    </nav>
  );
}

// Product Card
function ProdCard({product,onView,onAddToCart}){
  const variants=product.variants?.length?product.variants:[{label:"Default",color:"#C0C0C0",images:[]}];
  const[vi,setVi]=useState(0);const[qty,setQty]=useState(1);
  const v=variants[vi]||variants[0];
  const tag=product.tags?.[0];
  const base=typeof v?.price==="number"&&v.price>0?v.price:product.price;
  const orig=typeof v?.originalPrice==="number"&&v.originalPrice>0?v.originalPrice:(product.originalPrice||base);
  const salePercent=Number(product.salePercent||0);
  const calcPercent=salePercent>0?salePercent:(orig>base?Math.round(((orig-base)/orig)*100):0);
  const price=salePercent>0?Math.round(orig*(1-salePercent/100)):base;
  const hasSale=orig>price;
  const img=v?.images?.[0]||FALLBACK_IMG_600;
  return(
    <div className="pcard" onClick={()=>onView(product)}>
      <div className="pimg">
        <img src={img} alt={product.name} loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_600;}}/>
        {tag&&<span className={`pbadge pb-${tag}`}>{tag}</span>}
        {hasSale&&calcPercent>0&&<span className="stag">−{calcPercent}%</span>}
      </div>
      <div className="pbody">
        <div className="pcat">{product.category}</div>
        <div className="pname">{product.name}</div>
        <div className="pprice"><span className="pnow">{fmt(price)}</span>{hasSale&&<span className="pold">{fmt(orig)}</span>}</div>
        <div className="pvars">{variants.map((vv,i)=><div key={i} className={`vd ${vi===i?"on":""}`} style={{background:vv.color}} onClick={e=>{e.stopPropagation();setVi(i);}}/>)}</div>
        <div className="qmini" onClick={e=>e.stopPropagation()}>
          <label>Qty:</label>
          <div className="qmc"><button className="qmb" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button><div className="qmv">{qty}</div><button className="qmb" onClick={()=>setQty(q=>q+1)}>+</button></div>
        </div>
        <button className="atcbtn" onClick={e=>{e.stopPropagation();onAddToCart({...product,variants},vi,qty);}}>Add {qty} to Cart — {fmt(price*qty)}</button>
      </div>
    </div>
  );
}

// Zoom Image
function ZoomImg({src}){
  const wr=useRef();const ir=useRef();const[z,setZ]=useState(false);
  const onM=e=>{if(!wr.current||!ir.current)return;const r=wr.current.getBoundingClientRect();const x=((e.clientX-r.left)/r.width)*100;const y=((e.clientY-r.top)/r.height)*100;ir.current.style.transformOrigin=`${x}% ${y}%`;ir.current.style.transform="scale(2.8)";};
  const onL=()=>{setZ(false);if(ir.current)ir.current.style.transform="scale(1)";};
  return(
    <div className="mib" ref={wr} onMouseEnter={()=>setZ(true)} onMouseMove={onM} onMouseLeave={onL}>
      <img ref={ir} src={src} alt="" loading="lazy" style={{transition:z?"none":"transform .35s"}} onError={e=>{e.currentTarget.src=FALLBACK_IMG_600;}}/>
      {!z&&<div className="ztip">🔍 Hover to zoom</div>}
    </div>
  );
}

// Product Detail
function ProdDetail({product,onBack,onAddToCart}){
  const variants=product.variants?.length?product.variants:[{label:"Default",color:"#C0C0C0",images:[]}];
  const attributeGroups=useMemo(()=>{
    const map=new Map();
    variants.forEach(v=>{
      (v.attributes||[]).forEach(a=>{
        const name=a.attributeName||"Attribute";
        if(!map.has(name))map.set(name,new Set());
        if(a.name)map.get(name).add(a.name);
      });
    });
    return Array.from(map.entries()).map(([name,set])=>({name,values:Array.from(set)}));
  },[variants]);
  const[vi,setVi]=useState(0);const[ii,setIi]=useState(0);const[size,setSize]=useState(product.sizes?.[0]||"");const[qty,setQty]=useState(1);
  const[attrSel,setAttrSel]=useState({});
  useEffect(()=>{
    if(attributeGroups.length===0){setAttrSel({});return;}
    setAttrSel(prev=>{
      const next={...prev};
      attributeGroups.forEach(g=>{if(!next[g.name])next[g.name]=g.values[0];});
      Object.keys(next).forEach(k=>{if(!attributeGroups.find(g=>g.name===k))delete next[k];});
      return next;
    });
  },[attributeGroups]);
  const matchIndex=useMemo(()=>{
    if(attributeGroups.length===0)return 0;
    const idx=variants.findIndex(v=>{
      return attributeGroups.every(g=>{
        const sel=attrSel[g.name];
        if(!sel)return true;
        return (v.attributes||[]).some(a=>(a.attributeName||"Attribute")===g.name&&a.name===sel);
      });
    });
    return idx>=0?idx:0;
  },[variants,attributeGroups,attrSel]);
  const activeVi=attributeGroups.length?matchIndex:vi;
  useEffect(()=>setIi(0),[activeVi]);
  const v=variants[activeVi];
  const base=typeof v?.price==="number"&&v.price>0?v.price:product.price;
  const orig=typeof v?.originalPrice==="number"&&v.originalPrice>0?v.originalPrice:(product.originalPrice||base);
  const salePercent=Number(product.salePercent||0);
  const calcPercent=salePercent>0?salePercent:(orig>base?Math.round(((orig-base)/orig)*100):0);
  const price=salePercent>0?Math.round(orig*(1-salePercent/100)):base;
  const hasSale=orig>price;
  const saved=hasSale?orig-price:0;
  const img=v?.images?.[ii]||FALLBACK_IMG_600;
  const thumbs=(v?.images?.length?v.images:[FALLBACK_IMG_600]);
  return(
    <div className="dw">
      <button className="backbtn" onClick={onBack}>← Back to Shop</button>
      <div className="dgrid">
        <div>
          <ZoomImg src={img}/>
          {thumbs.length>0&&<div className="thumbs">{thumbs.map((im,i)=><div key={i} className={`th ${ii===i?"on":""}`} onClick={()=>setIi(i)}><img src={im} alt="" loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_600;}}/></div>)}</div>}
        </div>
        <div className="dinfo">
          <div className="dcat">{product.category}</div>
          <div className="dname">{product.name}</div>
          <div className="dprow">
            <span className="dprice">{fmt(price)}</span>
            {hasSale&&<span className="dpold">{fmt(orig)}</span>}
            {hasSale&&calcPercent>0&&<span className="dsave">−{calcPercent}% OFF</span>}
            {hasSale&&calcPercent<=0&&saved>0&&<span className="dsave">Save {fmt(saved)}</span>}
          </div>
          <p className="ddesc">{product.description}</p>
          {attributeGroups.length>0?(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {attributeGroups.map(g=>{
                const isSize=/size/i.test(g.name);
                return(
                  <div key={g.name}>
                    <div className="dlabel">{g.name}: {attrSel[g.name]||""}</div>
                    <div className={isSize?"sizes":"vbtns"}>
                      {g.values.map(val=>{
                        const color=!isSize?attrColor(val):"";
                        return(
                          <button key={val} className={`${isSize?"sbtn":"vbtn"} ${attrSel[g.name]===val?"on":""}`} onClick={()=>setAttrSel(s=>({...s,[g.name]:val}))}>
                            {color&&<span className="vdlg" style={{background:color}}/>}
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ):(
            <>
              <div>
                <div className="dlabel">Finish: {v?.label}</div>
                <div className="vbtns">{variants.map((vv,i)=><button key={i} className={`vbtn ${vi===i?"on":""}`} onClick={()=>setVi(i)}><span className="vdlg" style={{background:vv.color}}/>{vv.label||`Variant ${i+1}`}</button>)}</div>
              </div>
              {product.sizes?.length>0&&<div><div className="dlabel">Ring Size: {size}</div><div className="sizes">{product.sizes.map(s=><button key={s} className={`sbtn ${size===s?"on":""}`} onClick={()=>setSize(s)}>{s}</button>)}</div></div>}
            </>
          )}
          <div className="qrow">
            <div className="qctrl"><button className="qb" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button><div className="qv">{qty}</div><button className="qb" onClick={()=>setQty(q=>q+1)}>+</button></div>
            <button className="daddbtn" onClick={()=>{
              const sizeAttr=attributeGroups.find(g=>/size/i.test(g.name))?.name;
              const selSize=sizeAttr?attrSel[sizeAttr]||"":size;
              onAddToCart({...product,variants},activeVi,qty,selSize);
            }}>Add {qty} to Cart — {fmt(price*qty)}</button>
          </div>
          <div className="delinf">🚚 <div><strong>Dhaka Division:</strong> ৳80 delivery &nbsp;|&nbsp; <strong>Outside Dhaka:</strong> ৳120 delivery</div></div>
          <div className="feats">{[["🛡️","316L Surgical Steel"],["💧","Waterproof"],["🚫","Nickel-Free"],["♻️","Tarnish-Resistant"]].map(([ic,tx])=><div key={tx} className="feat"><span className="fic">{ic}</span><span className="ftx">{tx}</span></div>)}</div>
        </div>
      </div>
    </div>
  );
}

// Cart Sidebar
function CartSide({cart,onClose,updateQty,removeItem,onCheckout,coupon,setCoupon,promos}){
  const[code,setCode]=useState("");const[err,setErr]=useState("");
  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const disc=coupon?coupon.type==="percent"?Math.round(sub*coupon.value/100):coupon.type==="flat"?coupon.value:0:0;
  const apply=()=>{
    const p=promos.find(x=>x.code===code.toUpperCase()&&x.active);
    if(!p){setErr("Invalid promo code");return;}
    if(p.minOrder&&sub<p.minOrder){setErr(`Min order ${fmt(p.minOrder)} required`);return;}
    setCoupon(p);setErr("");setCode("");
  };
  return(
    <><div className="overlay" onClick={onClose}/>
    <div className="cside">
      <div className="chd"><div className="ctitle">Cart ({cart.reduce((s,i)=>s+i.qty,0)})</div><button className="xbtn" onClick={onClose}>✕</button></div>
      <div className="cbody">
        {cart.length===0?<div className="empty"><div className="eico">🛍</div><div>Your cart is empty</div><button className="bg" style={{padding:"10px 22px",fontSize:".82rem"}} onClick={onClose}>Start Shopping</button></div>
          :cart.map(item=>(
            <div key={item.cartId} className="ci">
              <img className="ciimg" src={item.image||FALLBACK_IMG_200} alt="" loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_200;}}/>
              <div className="ciinf">
                <div className="cinm">{item.name}</div>
                <div className="civ">{item.variant}{item.size?` · Size ${item.size}`:""}</div>
                <div className="cibot">
                  <span className="cip">{fmt(item.price*item.qty)}</span>
                  <div className="ciq">
                    <button className="ciqb" onClick={()=>updateQty(item.cartId,item.qty-1)}>−</button>
                    <span style={{minWidth:20,textAlign:"center",fontSize:".82rem"}}>{item.qty}</span>
                    <button className="ciqb" onClick={()=>updateQty(item.cartId,item.qty+1)}>+</button>
                    <button className="cirm" onClick={()=>removeItem(item.cartId)}>🗑</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
      {cart.length>0&&<div className="cft">
        {coupon?<div className="capplied"><span>✅ <b>{coupon.code}</b> — {coupon.label}</span><button style={{background:"none",color:"var(--red)",fontSize:".75rem"}} onClick={()=>setCoupon(null)}>Remove</button></div>
          :<div><div className="cprow"><input className="cpinp" placeholder="Promo code..." value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&apply()}/><button className="cobtn" onClick={apply}>Apply</button></div>{err&&<div style={{fontSize:".72rem",color:"var(--red)",marginBottom:8}}>{err}</div>}</div>}
        <div><div className="crow"><span>Subtotal</span><span>{fmt(sub)}</span></div>
          {disc>0&&<div className="crow discrow"><span>Discount ({coupon.code})</span><span>−{fmt(disc)}</span></div>}
          <div className="crow" style={{color:"var(--m)"}}><span>Delivery</span><span style={{fontSize:".75rem"}}>At checkout</span></div>
          <div className="crow big"><span>Total</span><span>{fmt(sub-disc)}</span></div></div>
        <button className="bg" style={{width:"100%",padding:14,borderRadius:10,fontSize:".9rem"}} onClick={onCheckout}>Proceed to Checkout →</button>
      </div>}
    </div></>
  );
}

// Checkout
function Checkout({cart,coupon,onPlace,onBack,customer}){
  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const disc=coupon?coupon.type==="percent"?Math.round(sub*coupon.value/100):coupon.type==="flat"?coupon.value:0:0;
  const[form,setForm]=useState(()=>({
    firstName:customer?.firstName||"",
    lastName:customer?.lastName||"",
    phone:customer?.phone||"",
    email:customer?.email||"",
    address:"",
    city:"",
    district:"",
    notes:"",
  }));
  const[errors,setErrors]=useState({});
  const[payment,setPayment]=useState({method:"cod",trx:""});
  const ch=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const ship=shipFee(form.district,coupon);
  const total=sub-disc+ship;

  useEffect(()=>{
    if(!customer) return;
    setForm(f=>({
      ...f,
      firstName:f.firstName||customer.firstName||"",
      lastName:f.lastName||customer.lastName||"",
      phone:f.phone||customer.phone||"",
      email:f.email||customer.email||"",
    }));
  },[customer]);

  const validate=()=>{
    const e={};
    if(!form.firstName)e.firstName="Required";
    if(!form.lastName)e.lastName="Required";
    if(!form.phone||form.phone.length<10)e.phone="Valid phone required";
    if(!form.address)e.address="Required";
    if(!form.city)e.city="Required";
    if(!form.district)e.district="Required";
    if(isMobileMoney(payment.method) && (!payment.trx || payment.trx.trim().length<5)) e.trx="Transaction number required";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const sub2=e=>{
    e.preventDefault();
    if(!validate())return;
    onPlace({
      address:form,
      payment:{method:payment.method, trx:(payment.trx||"").trim()||null},
      discount:disc,
      total,
      shipping:ship,
      items:cart,
      orderId:genId(),
      date:new Date().toISOString(),
      status:"Pending",
      coupon:coupon?.code||null,
    });
  };

  return(
    <div className="copage">
      <button className="backbtn" onClick={onBack}>← Back to Cart</button>
      <h1 style={{fontFamily:"var(--fd)",fontSize:"2rem",marginBottom:28}}>Checkout</h1>
      <form onSubmit={sub2}>
        <div className="cogrid">
          <div>
            <div className="cocard">
              <div className="coctitle">📍 Delivery Address</div>
              <div className="frow">
                <div className="fg"><label className="fl">First Name *</label><input className={`fi ${errors.firstName?"err":""}`} value={form.firstName} onChange={ch("firstName")} placeholder="Rahim"/>{errors.firstName&&<span className="etxt">{errors.firstName}</span>}</div>
                <div className="fg"><label className="fl">Last Name *</label><input className={`fi ${errors.lastName?"err":""}`} value={form.lastName} onChange={ch("lastName")} placeholder="Uddin"/>{errors.lastName&&<span className="etxt">{errors.lastName}</span>}</div>
              </div>
              <div className="frow">
                <div className="fg"><label className="fl">Phone *</label><input className={`fi ${errors.phone?"err":""}`} value={form.phone} onChange={ch("phone")} placeholder="01XXXXXXXXX"/>{errors.phone&&<span className="etxt">{errors.phone}</span>}</div>
                <div className="fg"><label className="fl">Email (optional)</label><input className="fi" value={form.email} onChange={ch("email")} placeholder="email@example.com"/></div>
              </div>
              <div className="fg"><label className="fl">Full Address *</label><input className={`fi ${errors.address?"err":""}`} value={form.address} onChange={ch("address")} placeholder="House, Road, Area"/>{errors.address&&<span className="etxt">{errors.address}</span>}</div>
              <div className="frow">
                <div className="fg"><label className="fl">City / Thana *</label><input className={`fi ${errors.city?"err":""}`} value={form.city} onChange={ch("city")} placeholder="Mirpur"/>{errors.city&&<span className="etxt">{errors.city}</span>}</div>
                <div className="fg"><label className="fl">District *</label>
                  <select className={`fi ${errors.district?"err":""}`} value={form.district} onChange={ch("district")}><option value="">Select District</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}</select>
                  {errors.district&&<span className="etxt">{errors.district}</span>}
                </div>
              </div>
              {form.district&&<div className="delinf" style={{marginBottom:12}}>🚚 <span>Delivery to <b>{form.district}</b>: <b style={{color:isDhaka(form.district)?"var(--grn)":"var(--g)"}}>{coupon?.type==="freeship"?"Free (Promo!)":fmt(ship)}</b> {isDhaka(form.district)?"(Inside Dhaka)":"(Outside Dhaka)"}</span></div>}
              <div className="fg"><label className="fl">Order Notes (optional)</label><textarea className="fi" value={form.notes} onChange={ch("notes")} rows={2} placeholder="Special delivery instructions..." style={{resize:"vertical"}}/></div>
            </div>

            <div className="cocard">
              <div className="coctitle">💳 Payment Method</div>

              <div className={`payopt ${payment.method==="cod"?"on":""}`} onClick={()=>setPayment(p=>({...p,method:"cod"}))} style={{cursor:"pointer"}}>
                <div className="rc">{payment.method==="cod"&&<div className="rd"/>}</div>
                <div>
                  <div style={{fontWeight:600}}>💵 Cash on Delivery (COD)</div>
                  <div style={{fontSize:".78rem",color:"var(--m)",marginTop:3}}>Pay cash when your order arrives at your door.</div>
                </div>
              </div>

              <div className={`payopt ${payment.method==="bkash"?"on":""}`} onClick={()=>setPayment(p=>({...p,method:"bkash"}))} style={{cursor:"pointer",marginTop:10}}>
                <div className="rc">{payment.method==="bkash"&&<div className="rd"/>}</div>
                <div>
                  <div style={{fontWeight:600}}>📱 bKash (Send Money)</div>
                  <div style={{fontSize:".78rem",color:"var(--m)",marginTop:3}}>After payment, enter your transaction number below.</div>
                </div>
              </div>

              <div className={`payopt ${payment.method==="nagad"?"on":""}`} onClick={()=>setPayment(p=>({...p,method:"nagad"}))} style={{cursor:"pointer",marginTop:10}}>
                <div className="rc">{payment.method==="nagad"&&<div className="rd"/>}</div>
                <div>
                  <div style={{fontWeight:600}}>📲 Nagad (Send Money)</div>
                  <div style={{fontSize:".78rem",color:"var(--m)",marginTop:3}}>After payment, enter your transaction number below.</div>
                </div>
              </div>

              {isMobileMoney(payment.method)&&(
                <div className="fg" style={{marginTop:14}}>
                  <label className="fl">Transaction Number *</label>
                  <input className={`fi ${errors.trx?"err":""}`} value={payment.trx} onChange={e=>setPayment(p=>({...p,trx:e.target.value}))} placeholder="e.g. 7A3BC9D..."/>
                  {errors.trx&&<span className="etxt">{errors.trx}</span>}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="sumbox">
              <div className="sumtitle">Order Summary</div>
              {cart.map(item=>(
                <div key={item.cartId} className="si_">
                  <img className="siimg" src={item.image||FALLBACK_IMG_200} alt="" loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_200;}}/>
                  <div className="siinf"><div className="sinm">{item.name}</div><div className="siv">{item.variant} · Qty: {item.qty}{item.size?` · Size ${item.size}`:""}</div></div>
                  <div className="sip">{fmt(item.price*item.qty)}</div>
                </div>
              ))}
              <hr className="dv"/>
              <div className="srow"><span>Subtotal</span><span>{fmt(sub)}</span></div>
              {disc>0&&<div className="srow discrow"><span>Discount ({coupon.code})</span><span>−{fmt(disc)}</span></div>}
              <div className="srow"><span>Delivery</span><span>{form.district?fmt(ship):"Select district"}</span></div>
              <hr className="dv"/>
              <div className="srow tot"><span>Total</span><span>{form.district?fmt(total):"—"}</span></div>
              <div className="codbox">✅ Payment: <b>{payLabel(payment.method)}</b>{isMobileMoney(payment.method)&&payment.trx?` · Trx: ${payment.trx}`:""}</div>
              <button type="submit" className="pbtn">Place Order →</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// Order Success
function OrderSuc({order,onContinue}){
  return(
    <div className="sucpage">
      <div className="sucico">🎉</div>
      <div className="suctitle">Order Placed!</div>
      <p className="sucsub">Thank you for shopping with MiniStain! Your premium stainless steel jewelry is on its way. We'll call you to confirm delivery.</p>
      <div className="oidbox">Order: {order.orderId}</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
        <button className="bg" onClick={onContinue}>Continue Shopping</button>
        <a className="fbbtn" href="https://www.facebook.com/profile.php?id=61586131658591" target="_blank" rel="noreferrer"><span>f</span> Follow MiniStain</a>
      </div>
    </div>
  );
}

// Admin Panel
function AdminPanel({products,setProducts,orders,setOrders,promos,setPromos,onViewProduct,theme,onThemeChange,themeSaving,themeStatus}){
  const[pullMsg,setPullMsg]=useState("");
  const[ordersPulling,setOrdersPulling]=useState(false);
  const syncOrdersFromOdoo=useCallback(async()=>{
    if(!SYNC_CONFIG.ordersEnabled){setPullMsg("Odoo sync disabled");return;}
    setOrdersPulling(true);
    try{
      const remote=await fetchOrdersFromOdoo();
      setOrders(Array.isArray(remote)?remote:[]);
      setPullMsg(`Loaded ${Array.isArray(remote)?remote.length:0} orders from Odoo`);
    }catch(e){
      setPullMsg(e?.message||"Order fetch failed");
    }finally{
      setOrdersPulling(false);
    }
  },[setOrders]);
  const[productSyncing,setProductSyncing]=useState(false);
  const[promoSyncing,setPromoSyncing]=useState(false);
  const[prodSyncMsg,setProdSyncMsg]=useState("");
  const[promoSyncMsg,setPromoSyncMsg]=useState("");
  const syncProductsFromOdoo=useCallback(async()=>{
    if(!SYNC_CONFIG.productsEnabled){setProdSyncMsg("Odoo sync disabled");return;}
    setProductSyncing(true);
    try{
      const remote=await fetchProductsFromOdoo();
      if(Array.isArray(remote)) setProducts(remote);
      setProdSyncMsg(`Synced ${Array.isArray(remote)?remote.length:0} products`);
    }catch(e){
      setProdSyncMsg(e?.message||"Product sync failed");
    }finally{
      setProductSyncing(false);
    }
  }, [setProducts, setProdSyncMsg, setProductSyncing]);
  const syncPromosFromOdoo=useCallback(async()=>{
    if(!SYNC_CONFIG.promosEnabled){setPromoSyncMsg("Odoo sync disabled");return;}
    setPromoSyncing(true);
    try{
      const remote=await fetchPromosFromOdoo();
      if(Array.isArray(remote)) setPromos(remote);
      setPromoSyncMsg(`Synced ${Array.isArray(remote)?remote.length:0} promotions`);
    }catch(e){
      setPromoSyncMsg(e?.message||"Promotion sync failed");
    }finally{
      setPromoSyncing(false);
    }
  }, [setPromos, setPromoSyncMsg, setPromoSyncing]);
  const[tab,setTab]=useState("dashboard");
  const[settingsTab,setSettingsTab]=useState("theme");
  const[vOrder,setVO]=useState(null);
  const rev=orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.total,0);
  const pend=orders.filter(o=>o.status==="Pending").length;
  const displayOrders=[...orders].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const sc={Pending:"bpend",Processing:"bproc",Delivered:"bdel",Cancelled:"bcan"};
  const tabs=[{id:"dashboard",ico:"📊",l:"Dashboard"},{id:"products",ico:"💎",l:"Products"},{id:"orders",ico:"📦",l:"Orders"},{id:"promotions",ico:"🏷️",l:"Promotions"},{id:"settings",ico:"⚙️",l:"Settings"}];
  useEffect(()=>{
    if(tab==="dashboard"){
      syncOrdersFromOdoo();
      syncProductsFromOdoo();
      syncPromosFromOdoo();
    }else if(tab==="orders"){
      syncOrdersFromOdoo();
    }else if(tab==="products"){
      syncProductsFromOdoo();
    }else if(tab==="promotions"){
      syncPromosFromOdoo();
    }
  },[tab, syncOrdersFromOdoo, syncProductsFromOdoo, syncPromosFromOdoo]);

  return(
    <div className="awrap">
      <div className="aside">
        <div className="aslogo">🔧 Admin Panel</div>
        {tabs.map(t=><button key={t.id} className={`aitm ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}><span>{t.ico}</span>{t.l}</button>)}
        {tab==="settings"&&(
          <div className="asub">
            <div className="asubtitle">Appearance</div>
            <button className={`asubitm ${settingsTab==="theme"?"on":""}`} onClick={()=>setSettingsTab("theme")}>Themes</button>
          </div>
        )}
      </div>
      <div className="amain">
        {/* Dashboard */}
        {tab==="dashboard"&&<>
          <div className="ahd"><div className="atitle">Dashboard</div></div>
          <div className="stats">
            <div className="stc"><div className="stv">{orders.length}</div><div className="stl">Total Orders</div></div>
            <div className="stc"><div className="stv">{pend}</div><div className="stl">Pending</div></div>
            <div className="stc"><div className="stv">{fmt(rev)}</div><div className="stl">Revenue</div></div>
            <div className="stc"><div className="stv">{products.length}</div><div className="stl">Products</div></div>
            <div className="stc"><div className="stv">{promos.filter(p=>p.active).length}</div><div className="stl">Active Promos</div></div>
          </div>
          <div className="tcard">
            <div className="tchd"><div className="tchtitle">Recent Orders</div></div>
            {orders.length===0?<div style={{padding:40,textAlign:"center",color:"var(--m)"}}>No orders yet</div>:(
              <table className="t"><thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>{orders.slice(0,8).map(o=><tr key={o.orderId}>
                  <td style={{fontFamily:"monospace",color:"var(--g)",fontSize:".75rem",cursor:"pointer"}} onClick={()=>setVO(o)}>{o.orderId}</td>
                  <td>{o.address.firstName} {o.address.lastName}</td>
                  <td style={{color:"var(--g)",fontWeight:600}}>{fmt(o.total)}</td>
                  <td><span className={`badge ${sc[o.status]}`}>{o.status}</span></td>
                </tr>)}</tbody>
              </table>
            )}
          </div>
        </>}
        {/* Products */}
        {tab==="products"&&<>
          <div className="ahd">
            <div className="atitle">Products ({products.length})</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button className="bsm2" onClick={syncProductsFromOdoo} disabled={!SYNC_CONFIG.productsEnabled||productSyncing}>
                {productSyncing?"Syncing...":"🔄 Sync Products"}
              </button>
              <span style={{fontSize:".75rem",color:"var(--m)",alignSelf:"center"}}>
                {SYNC_CONFIG.productsEnabled?"Managed in Odoo":"Odoo sync disabled"}
              </span>
              {prodSyncMsg&&<span style={{fontSize:".75rem",color:"var(--m)",alignSelf:"center"}}>{prodSyncMsg}</span>}
            </div>
          </div>
          <div className="tcard">
            <table className="t"><thead><tr><th>Photo</th><th>Name</th><th>Category</th><th>Price</th><th>Sale</th><th>Stock</th><th>Odoo ID</th><th>View</th></tr></thead>
              <tbody>{products.map(p=>{const img=p.variants?.[0]?.images?.[0]||FALLBACK_IMG_200;const odooId=p.odooProductId||p.id;const tmplId=p.odooTemplateId;return(
                <tr key={p.id} style={{cursor:"pointer"}} onClick={()=>onViewProduct&&onViewProduct(p)}>
                  <td><img className="pthmb" src={img} alt="" loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_200;}}/></td>
                  <td style={{fontWeight:500}}>{p.name}</td>
                  <td><span className="badge bcat">{p.category}</span></td>
                  <td style={{color:"var(--g)"}}>{fmt(p.price)}</td>
                  <td>{p.salePercent>0?<span className="badge bsale">−{p.salePercent}%</span>:<span style={{color:"var(--m)"}}>—</span>}</td>
                  <td>{p.stock}</td>
                  <td style={{fontFamily:"monospace",color:"var(--m)",fontSize:".75rem"}}>
                    {odooId||"—"}
                    {tmplId&&tmplId!==odooId&&<div style={{fontSize:".7rem",color:"var(--m)",marginTop:4}}>tmpl {tmplId}</div>}
                  </td>
                  <td><button className="bsm2" onClick={e=>{e.stopPropagation();onViewProduct&&onViewProduct(p);}}>View</button></td>
                </tr>);})}</tbody>
            </table>
          </div>
        </>}
        {/* Orders */}
        {tab==="orders"&&<>
          <div className="ahd">
            <div className="atitle">Orders ({orders.length})</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button className="bsm2" onClick={syncOrdersFromOdoo} disabled={ordersPulling||!SYNC_CONFIG.ordersEnabled}>
                {ordersPulling?"Loading...":"↻ Refresh from Odoo"}
              </button>
              <span style={{fontSize:".75rem",color:"var(--m)",alignSelf:"center"}}>
                {SYNC_CONFIG.ordersEnabled?"Odoo orders":"Odoo sync disabled"}
              </span>
              {pullMsg&&<span style={{fontSize:".75rem",color:"var(--m)",alignSelf:"center"}}>{pullMsg}</span>}
            </div>
          </div>
          <div className="tcard">
            {orders.length===0?<div style={{padding:60,textAlign:"center",color:"var(--m)"}}>No orders yet!</div>:(
              <table className="t"><thead><tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>District</th><th>Total</th><th>Pay</th><th>Status</th><th>Odoo ID</th></tr></thead>
              <tbody>{displayOrders.map(o=>{
                  return(
                    <tr key={o.orderId}>
                      <td style={{fontFamily:"monospace",color:"var(--g)",fontSize:".72rem",cursor:"pointer"}} onClick={()=>setVO(o)}>{o.orderId}</td>
                      <td style={{fontWeight:500}}>{o.address.firstName} {o.address.lastName}</td>
                      <td style={{color:"var(--m)",fontSize:".8rem"}}>{o.address.phone}</td>
                      <td><span className="badge bcat">{o.address.district}</span></td>
                      <td style={{color:"var(--g)",fontWeight:600}}>{fmt(o.total)}</td>
                      <td>
                        <span className={`badge ${payBadge(o.payment?.method||"cod")}`}>{payLabel(o.payment?.method||"cod")}</span>
                        {o.payment?.trx && (
                          <div style={{fontFamily:"monospace",fontSize:".7rem",color:"var(--m)",marginTop:4}}>{o.payment.trx}</div>
                        )}
                      </td>
                      <td><span className={`badge ${sc[o.status]}`}>{o.status}</span></td>
                      <td>
                        {o.odooOrderId&&<div style={{fontFamily:"monospace",fontSize:".7rem",color:"var(--m)"}}>{o.odooOrderId}</div>}
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        </>}
        {/* Promotions */}
        {tab==="promotions"&&<>
          <div className="ahd">
            <div className="atitle">Promotions</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button className="bsm2" onClick={syncPromosFromOdoo} disabled={!SYNC_CONFIG.promosEnabled||promoSyncing}>
                {promoSyncing?"Syncing...":"🔄 Sync Promotions"}
              </button>
              <span style={{fontSize:".75rem",color:"var(--m)",alignSelf:"center"}}>
                {SYNC_CONFIG.promosEnabled?"Managed in Odoo":"Odoo sync disabled"}
              </span>
              {promoSyncMsg&&<span style={{fontSize:".75rem",color:"var(--m)",alignSelf:"center"}}>{promoSyncMsg}</span>}
            </div>
          </div>
          <div className="pclist">
            {promos.map(p=>(
              <div key={p.id} className="pci">
                <div><div className="pcode">{p.code}</div><div className="pinf">{p.label} · Min: {p.minOrder?fmt(p.minOrder):"No min"} · {p.type==="freeship"?"Free Ship":p.type==="percent"?`${p.value}% off`:`৳${p.value} off`}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span className={`badge ${p.active?"bon":"boff"}`}>{p.active?"Active":"Off"}</span>
                </div>
              </div>
            ))}
            {promos.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--m)"}}>No promotions yet</div>}
          </div>
        </>}
        {/* Settings */}
        {tab==="settings"&&<>
          <div className="ahd"><div className="atitle">Settings</div></div>
          {settingsTab==="theme"&&(
            <div className="tcard">
              <div className="tchd">
                <div className="tchtitle">Theme</div>
                <div style={{fontSize:".72rem",color:"var(--m)"}}>
                  {themeSaving?"Saving...":themeStatus||"Global for all visitors"}
                </div>
              </div>
              <div style={{padding:18}}>
                <div className="themegrid">
                  {THEMES.map((t)=>(
                    <button
                      key={t.id}
                      type="button"
                      className={`themeopt ${theme===t.id?"on":""}`}
                      onClick={()=>onThemeChange(t.id)}
                    >
                      <div className="themebar" style={{background:`linear-gradient(135deg,${t.preview.accent},${t.preview.accent2})`}}/>
                      <div className="themelabel">{t.label}</div>
                      <div className="themedesc">{t.desc}</div>
                      <div className="themeswatch">
                        <span style={{background:t.preview.bg}}/>
                        <span style={{background:t.preview.surface}}/>
                        <span style={{background:t.preview.accent}}/>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>}
      </div>
      {vOrder&&(
        <div className="mov" onClick={e=>e.target===e.currentTarget&&setVO(null)}>
          <div className="mbox" style={{maxWidth:520}}>
            <div className="mhd"><div className="mtitle">Order Detail</div><button className="xbtn" onClick={()=>setVO(null)}>✕</button></div>
            <div className="mbody">
              <div style={{fontFamily:"monospace",color:"var(--g)",marginBottom:16,fontSize:"1rem"}}>{vOrder.orderId}</div>
              {vOrder.odooOrderId&&<div style={{fontSize:".8rem",color:"var(--m)",marginBottom:8}}>Odoo Order ID: <span style={{fontFamily:"monospace"}}>{vOrder.odooOrderId}</span></div>}
              {vOrder.syncError&&<div style={{fontSize:".8rem",color:"var(--red)",marginBottom:8}}>Sync Error: {vOrder.syncError}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[["Customer",`${vOrder.address.firstName} ${vOrder.address.lastName}`],["Phone",vOrder.address.phone],["Payment",`${payLabel(vOrder.payment?.method||"cod")}${vOrder.payment?.trx?" · Trx: "+vOrder.payment.trx:""}`],["Address",vOrder.address.address],["City",vOrder.address.city],["District",vOrder.address.district],["Date",new Date(vOrder.date).toLocaleDateString("en-BD")]].map(([k,v])=><div key={k}><div className="fl">{k}</div><div style={{fontSize:".85rem",marginTop:3}}>{v}</div></div>)}
              </div>
              {vOrder.address.notes&&<div style={{background:"var(--s2)",border:"1px solid var(--b)",borderRadius:8,padding:10,fontSize:".82rem",marginBottom:14}}><b>Notes:</b> {vOrder.address.notes}</div>}
              <hr className="dv"/>
              {vOrder.items.map(i=><div key={i.cartId} className="si_" style={{marginBottom:10}}><img className="siimg" src={i.image||FALLBACK_IMG_200} alt="" loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_200;}}/><div className="siinf"><div className="sinm">{i.name}</div><div className="siv">{i.variant} · Qty: {i.qty}{i.size?` · Size ${i.size}`:""}</div></div><div className="sip">{fmt(i.price*i.qty)}</div></div>)}
              <hr className="dv"/>
              {vOrder.discount>0&&<div className="srow discrow"><span>Discount ({vOrder.coupon})</span><span>−{fmt(vOrder.discount)}</span></div>}
              <div className="srow"><span>Delivery ({isDhaka(vOrder.address.district)?"Inside Dhaka":"Outside Dhaka"})</span><span>{fmt(vOrder.shipping)}</span></div>
              <div className="srow tot"><span>Total</span><span>{fmt(vOrder.total)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrustBar(){
  return(
    <div className="trubar">
      <div className="trus">
        {[["💧","Waterproof"],["🛡️","316L Steel"],["🚚","Dhaka ৳80 · Others ৳120"],["💵","Cash on Delivery"],["↩️","Easy Returns"]]
          .map(([ic,lb])=><div key={lb} className="tri"><span style={{fontSize:"1.1rem"}}>{ic}</span>{lb}</div>)}
      </div>
    </div>
  );
}

function SiteFooter(){
  return(
    <footer className="footer">
      <div className="ftgrid">
        <div className="ftbrand">
          <div style={{fontFamily:"var(--fd)",fontSize:"1.6rem",fontWeight:700,background:"linear-gradient(135deg,var(--g),var(--g2))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MiniStain</div>
          <p>Premium stainless steel jewelry crafted for everyday luxury. Hypoallergenic, waterproof, and designed to last a lifetime.</p>
          <a className="fbbtn" href="https://www.facebook.com/profile.php?id=61586131658591" target="_blank" rel="noreferrer"><span>f</span> Follow on Facebook</a>
        </div>
        <div className="ftcol"><h4>Shop</h4>{["Rings","Necklaces","Bracelets","Earrings","New Arrivals"].map(l=><span key={l} className="ftlnk">{l}</span>)}</div>
        <div className="ftcol"><h4>Info</h4>{["About Us","Size Guide","Care Instructions","Return Policy","FAQ"].map(l=><span key={l} className="ftlnk">{l}</span>)}</div>
        <div className="ftcol"><h4>Contact</h4>
          <a className="ftlnk" href="https://www.facebook.com/profile.php?id=61586131658591" target="_blank" rel="noreferrer">📘 Facebook: MiniStain</a>
          <span className="ftlnk">💵 Cash on Delivery</span>
          <span className="ftlnk">🚚 Dhaka: ৳80 · Others: ৳120</span>
        </div>
      </div>
      <div className="ftbot"><span>© 2025 MiniStain. All rights reserved.</span><span>Stainless Steel Jewelry · Bangladesh</span></div>
    </footer>
  );
}

function HomePage({products,promos,onView,onAddToCart,loading,onShopAll,onCategory}){
  const active=promos.filter(p=>p.active);
  const cats=Array.from(new Set(products.map(p=>p.category).filter(Boolean))).sort();
  const tagMatch=(p,keys)=>(p.tags||[]).some(t=>keys.includes(String(t).toLowerCase()));
  const featuredRaw=products.filter(p=>tagMatch(p,["featured","feature","top","editor","highlight"]));
  const featured=(featuredRaw.length?featuredRaw:products).slice(0,6);
  const newRaw=products.filter(p=>tagMatch(p,["new","new arrival","new-arrival"]));
  const newItems=(newRaw.length?newRaw:[]).slice(0,6);
  const promoValue=p=>p.type==="percent"?`${p.value}% OFF`:p.type==="flat"?`${fmt(p.value)} OFF`:"Free Shipping";
  const promoMin=p=>p.minOrder?`Min order ${fmt(p.minOrder)}`:"No minimum";
  const getImg=p=>p?.variants?.[0]?.images?.[0]||FALLBACK_IMG_600;
  const getDiscountPct=p=>{
    const v=p?.variants?.[0];
    const base=typeof v?.price==="number"&&v.price>0?v.price:p.price;
    const orig=typeof v?.originalPrice==="number"&&v.originalPrice>0?v.originalPrice:(p.originalPrice||base);
    if(orig>base) return Math.round(((orig-base)/orig)*100);
    const sp=Number(p.salePercent||0);
    return sp>0?sp:0;
  };
  const slideItems=(products.length?products:[]).slice(0,5);
  const slides=slideItems.length
    ? slideItems.map(p=>({
        id:p.id,
        image:getImg(p),
        title:p.name,
        subtitle:p.category||"MiniStain",
        action:()=>onView(p),
      }))
    :[{id:"fallback",image:FALLBACK_IMG_600,title:"Premium Stainless Steel",subtitle:"Daily wear jewelry",action:onShopAll}];
  const[slide,setSlide]=useState(0);
  useEffect(()=>{
    if(slides.length<2) return;
    const t=setInterval(()=>setSlide(s=>(s+1)%slides.length),5000);
    return()=>clearInterval(t);
  },[slides.length]);
  const dealProduct=products.reduce((best,p)=>{
    const pct=getDiscountPct(p);
    if(pct<=0) return best;
    if(!best) return p;
    return pct>getDiscountPct(best)?p:best;
  },null);
  const trendCats=cats.slice(0,6);
  const[trend,setTrend]=useState(trendCats[0]||"All");
  const trendList=products
    .filter(p=>trend==="All"||p.category===trend)
    .slice(0,8);
  const banners=products.slice(0,4);
  const offerItems=products.filter(p=>getDiscountPct(p)>0).slice(0,6);

  return(
    <>
      {active.length>0&&<div className="pb">🏷️ {active.map(p=>`${p.code} ${promoValue(p)}`).join("  ·  ")}  — Use codes at checkout!</div>}
      <section className="hero">
        <div className="hero-slider">
          {slides.map((s,i)=>(
            <div key={s.id} className={`hero-slide ${i===slide?"on":""}`}>
              <img src={s.image} alt={s.title} loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_600;}}/>
            </div>
          ))}
          <div className="hero-fade"/>
          <div className="hero-dots">
            {slides.map((_,i)=>(
              <button key={i} className={i===slide?"on":""} onClick={()=>setSlide(i)} aria-label={`Slide ${i+1}`}/>
            ))}
          </div>
        </div>
        <div className="hero-in">
          <div className="hpill">✦ Premium Stainless Steel Jewelry</div>
          <h1>Wear <em>Luxury</em><br/>Every Day</h1>
          <p>Minimal, bold, and waterproof. Designed for daily wear with lasting shine.</p>
          <div className="hacts">
            <button className="bg" onClick={onShopAll}>Shop All</button>
            <button className="bgh" onClick={()=>onCategory(cats[0]||"All")}>Shop {cats[0]||"Collection"}</button>
          </div>
          <div className="hero-stats">
            {[
              ["316L Steel","Surgical grade"],
              ["Waterproof","Daily wear safe"],
              ["Cash on Delivery","Nationwide"],
            ].map(([k,v])=>(
              <div key={k} className="stat">
                <div className="statv">{k}</div>
                <div className="statl">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {active.length>0&&(
        <section className="sec">
          <div className="sch">
            <h2 className="stitle">Active <em>Promotions</em></h2>
            <button className="bgh bsm" onClick={onShopAll}>Shop All</button>
          </div>
          <div className="promogrid">
            {active.map(p=>(
              <div key={p.code} className="promocard">
                <div className="promocode">{p.code}</div>
                <div className="promoval">{promoValue(p)}</div>
                <div className="promolabel">{p.label||"Promotion"}</div>
                <div className="promomin">{promoMin(p)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cats.length>0&&(
        <section className="sec">
          <div className="sch">
            <h2 className="stitle">Shop by <em>Category</em></h2>
            <button className="bgh bsm" onClick={onShopAll}>Browse All</button>
          </div>
          <div className="catgrid">
            {cats.slice(0,10).map(c=>(
              <button key={c} type="button" className="catcard" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55)),url(${getImg(products.find(p=>p.category===c))})`}} onClick={()=>onCategory(c)}>
                <div className="catname">{c}</div>
                <div className="catcount">{products.filter(p=>p.category===c).length} items</div>
                <div className="catcta">Shop →</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {trendCats.length>0&&(
        <section className="sec">
          <div className="sch">
            <h2 className="stitle">Trending <em>Now</em></h2>
            <button className="bgh bsm" onClick={()=>onCategory(trend)}>See More</button>
          </div>
          <div className="trendtabs">
            {trendCats.map(c=>(
              <button key={c} className={`trendtab ${trend===c?"on":""}`} onClick={()=>setTrend(c)}>{c}</button>
            ))}
          </div>
          {trendList.length===0
            ?<div style={{textAlign:"center",padding:"40px 0",color:"var(--m)"}}>No products found</div>
            :<div className="pgrid">{trendList.map(p=><ProdCard key={`trend-${p.id}`} product={p} onView={onView} onAddToCart={onAddToCart}/>)}</div>}
        </section>
      )}

      {banners.length>0&&(
        <section className="sec">
          <div className="bannergrid">
            {banners.map(p=>(
              <button key={`ban-${p.id}`} className="banner" onClick={()=>onView(p)}>
                <img src={getImg(p)} alt={p.name} loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_600;}}/>
                <div className="btxt">
                  <div className="btitle">{p.name}</div>
                  <div className="bcta">Shop now →</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="sec">
        <div className="sch">
          <h2 className="stitle">Featured <em>Collection</em></h2>
          <button className="bgh bsm" onClick={onShopAll}>Shop All</button>
        </div>
        {loading&&products.length===0?(
          <div className="pgrid">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="skcard">
                <div className="skimg skpulse"/>
                <div className="skbody">
                  <div className="skline sm skpulse"/>
                  <div className="skline lg skpulse"/>
                  <div className="skline md skpulse"/>
                </div>
              </div>
            ))}
          </div>
        ):featured.length===0?(
          <div style={{textAlign:"center",padding:"40px 0",color:"var(--m)"}}>No products yet</div>
        ):(
          <div className="pgrid">{featured.map(p=><ProdCard key={`feat-${p.id}`} product={p} onView={onView} onAddToCart={onAddToCart}/>)}</div>
        )}
      </section>

      {dealProduct&&(
        <section className="sec">
          <div className="dealcard">
            <img className="dealimg" src={getImg(dealProduct)} alt={dealProduct.name} loading="lazy" onError={e=>{e.currentTarget.src=FALLBACK_IMG_600;}}/>
            <div className="dealinfo">
              <div className="dealpill">Deal of the Week</div>
              <div className="dealtitle">{dealProduct.name}</div>
              <div className="dealsub">{dealProduct.category||"Limited drop"}</div>
              <div className="dealprice">
                <span className="dealnow">{fmt(dealProduct.variants?.[0]?.price||dealProduct.price||0)}</span>
                <span className="dealold">{fmt(dealProduct.variants?.[0]?.originalPrice||dealProduct.originalPrice||dealProduct.price||0)}</span>
                <span className="dealsave">Save {getDiscountPct(dealProduct)}%</span>
              </div>
              <div className="dealacts">
                <button className="bg" onClick={()=>onView(dealProduct)}>View Deal</button>
                <button className="bgh" onClick={onShopAll}>Shop All</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {newItems.length>0&&(
        <section className="sec">
          <div className="sch">
            <h2 className="stitle">New <em>Arrivals</em></h2>
            <button className="bgh bsm" onClick={onShopAll}>Shop All</button>
          </div>
          <div className="pgrid">{newItems.map(p=><ProdCard key={`new-${p.id}`} product={p} onView={onView} onAddToCart={onAddToCart}/>)}</div>
        </section>
      )}

      {offerItems.length>0&&(
        <section className="sec">
          <div className="sch">
            <h2 className="stitle">Unlimited <em>Offer</em></h2>
            <button className="bgh bsm" onClick={onShopAll}>Shop All</button>
          </div>
          <div className="pgrid">{offerItems.map(p=><ProdCard key={`offer-${p.id}`} product={p} onView={onView} onAddToCart={onAddToCart}/>)}</div>
        </section>
      )}

      <section className="sec">
        <div className="sch">
          <h2 className="stitle">Why <em>MiniStain</em></h2>
        </div>
        <div className="featuregrid">
          {[
            ["✨","Tarnish Resistant","Built for daily wear without fading."],
            ["🛡️","Hypoallergenic","Safe for sensitive skin."],
            ["💧","Waterproof","Shower, swim, repeat."],
            ["🚚","Fast Delivery","Dhaka & nationwide shipping."],
          ].map(([ic,t,tx])=>(
            <div key={t} className="featurecard">
              <div className="fic">{ic}</div>
              <div className="ftitle">{t}</div>
              <div className="fdesc">{tx}</div>
            </div>
          ))}
        </div>
      </section>

      <TrustBar/>
      <SiteFooter/>
    </>
  );
}

function ShopPage({products,promos,onView,onAddToCart,loading,filter,setFilter}){
  const[search,setSearch]=useState("");
  const cats=["All",...Array.from(new Set(products.map(p=>p.category).filter(Boolean))).sort()];
  const active=promos.filter(p=>p.active);
  const list=products.filter(p=>(filter==="All"||p.category===filter)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())));
  const promoValue=p=>p.type==="percent"?`${p.value}% OFF`:p.type==="flat"?`${fmt(p.value)} OFF`:"Free Shipping";
  return(
    <>
      {active.length>0&&<div className="pb">🏷️ {active.map(p=>`${p.code} ${promoValue(p)}`).join("  ·  ")}  — Use codes at checkout!</div>}
      <div className="sec">
        <div className="sch">
          <h2 className="stitle">Our <em>Collection</em></h2>
          <div className="sw"><span className="sico">🔍</span><input placeholder="Search jewelry..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        </div>
        <div className="ftabs">{cats.map(c=><button key={c} className={`ftab ${filter===c?"on":""}`} onClick={()=>setFilter(c)}>{c}</button>)}</div>
        {loading&&products.length===0?(
          <div className="pgrid">
            {Array.from({length:8}).map((_,i)=>(
              <div key={i} className="skcard">
                <div className="skimg skpulse"/>
                <div className="skbody">
                  <div className="skline sm skpulse"/>
                  <div className="skline lg skpulse"/>
                  <div className="skline md skpulse"/>
                </div>
              </div>
            ))}
          </div>
        ):list.length===0?(
          <div style={{textAlign:"center",padding:"60px 0",color:"var(--m)"}}>No products found</div>
        ):(
          <div className="pgrid">{list.map(p=><ProdCard key={p.id} product={p} onView={onView} onAddToCart={onAddToCart}/>)}</div>
        )}
      </div>
      <TrustBar/>
      <SiteFooter/>
    </>
  );
}

// App
export default function App(){
  const[products,setProducts]=useState(INIT_PRODUCTS);
  const[productsLoading,setProductsLoading]=useState(true);
  const[orders,setOrders]=useState([]);
  const[cart,setCart]=useLS("ms_cart",[]);
  const[promos,setPromos]=useState(INITIAL_PROMOS);
  const[customer,setCustomer]=useState(null);
  const[theme,setTheme]=useLS("ms_theme",THEMES[0].id);
  useEffect(()=>{
    (async()=>{
      setProductsLoading(true);
      try{
        const remote=await fetchProductsFromOdoo();
        if(Array.isArray(remote)) setProducts(remote);
      }catch(e){}finally{
        setProductsLoading(false);
      }
      try{
        const remotePromos=await fetchPromosFromOdoo();
        if(Array.isArray(remotePromos)) setPromos(remotePromos);
      }catch(e){}
    })();
  },[setProducts,setPromos]);
  useEffect(()=>{
    (async()=>{
      try{
        const data=await authJSON("/api/auth/me",{method:"GET"});
        if(data?.user) setCustomer(data.user);
      }catch(e){}
    })();
  },[]);
  useLayoutEffect(()=>{applyThemeVars(theme);},[theme]);
  useEffect(()=>{
    (async()=>{
      try{
        const remote=await fetchSettingsFromOdoo();
        const remoteTheme=String(remote?.theme||"").trim();
        if(remoteTheme && THEMES.some(t=>t.id===remoteTheme)) setTheme(remoteTheme);
      }catch(e){
        setThemeStatus("Odoo settings unavailable");
      }
    })();
  },[setTheme]);
  useEffect(()=>{
    if(!products.length) return;
    const syncFromUrl=()=>{
      const pid=getProductIdFromUrl();
      if(!pid){setViewProd(null);return;}
      const found=products.find(p=>String(p.id)===String(pid)||String(p.odooTemplateId)===String(pid));
      if(found){setPage("shop");setViewProd(found);}
    };
    syncFromUrl();
    if(typeof window!=="undefined"){
      window.addEventListener("popstate",syncFromUrl);
      return()=>window.removeEventListener("popstate",syncFromUrl);
    }
  },[products]);
  const[adminAuth,setAdminAuth]=useLS("ms_admin",false);
  const[coupon,setCoupon]=useState(null);
  const[page,setPage]=useState("home");
  const[shopFilter,setShopFilter]=useState("All");
  const[viewProd,setViewProd]=useState(null);
  const[cartOpen,setCartOpen]=useState(false);
  const[checkout,setCheckout]=useState(false);
  const[sucOrder,setSucOrder]=useState(null);
  const[toast,setToast]=useState(null);
  const[themeSaving,setThemeSaving]=useState(false);
  const[themeStatus,setThemeStatus]=useState("");
  const showToast=(msg,icon="✦")=>setToast({msg,icon});
  const handleAuth=user=>{
    setCustomer(user||null);
    if(user) showToast("Logged in","👤");
  };
  const updateTheme=(id)=>{
    const t=THEMES.find(x=>x.id===id)||THEMES[0];
    setTheme(t.id);
    showToast(`Theme set to ${t.label}`,"🎨");
    setThemeStatus("");
    setThemeSaving(true);
    saveSettingsToOdoo({ theme: t.id })
      .then(()=>{setThemeStatus("Saved to Odoo");})
      .catch((e)=>{setThemeStatus("Save failed");showToast(e?.message||"Theme save failed","⚠️");})
      .finally(()=>setThemeSaving(false));
  };
  const openProduct=(product, { replace = false } = {})=>{
    if(!product) return;
    setPage("shop");
    setViewProd(product);
    updateProductInUrl(product.id, { replace });
  };
  const closeProduct=({ replace = false } = {})=>{
    setViewProd(null);
    updateProductInUrl(null, { replace });
  };
  const addToCart=(product,vi,qty=1,size="")=>{
    const v=product.variants[vi];
    const base=typeof v?.price==="number"&&v.price>0?v.price:product.price;
    const orig=typeof v?.originalPrice==="number"&&v.originalPrice>0?v.originalPrice:(product.originalPrice||base);
    const salePercent=Number(product.salePercent||0);
    const price=salePercent>0?Math.round(orig*(1-salePercent/100)):base;
    const cartId=`${product.id}-${vi}-${size}`;
    const img=v?.images?.[0]||"";
    const odooProductId=v?.odooProductId||product.odooProductId||product.id;
    setCart(prev=>{const ex=prev.find(i=>i.cartId===cartId);if(ex)return prev.map(i=>i.cartId===cartId?{...i,qty:i.qty+qty}:i);return[...prev,{cartId,id:product.id,odooProductId,name:product.name,price,variant:v.label,image:img,qty,size}];});
    showToast(`${product.name} × ${qty} added!`,`✦`);setCartOpen(true);
  };
  const updateQty=(id,qty)=>{if(qty<1){setCart(p=>p.filter(i=>i.cartId!==id));return;}setCart(p=>p.map(i=>i.cartId===id?{...i,qty}:i));};
  const removeItem=id=>setCart(p=>p.filter(i=>i.cartId!==id));
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const placeOrder=async(data)=>{
    const order={...data,odooOrderId:null,syncedAt:null,syncError:null};
    try{
      const res=await syncOrderToBackend(order);
      const odooOrderId=res?.odooOrderId??res?.id??null;
      const finalOrder={...order,odooOrderId};
      setCart([]);
      setCoupon(null);
      setCheckout(false);
      setSucOrder(finalOrder);
      setPage("success");
      try{
        const remote=await fetchOrdersFromOdoo();
        if(Array.isArray(remote)) setOrders(remote);
      }catch(e){}
    }catch(e){
      showToast(e?.message||"Order sync failed","⚠️");
    }
  };
  const setPage2=p=>{if(p==="admin"&&!adminAuth){setPage("adminlogin");return;}setPage(p);setViewProd(null);updateProductInUrl(null,{replace:true});};
  const logout=()=>{setAdminAuth(false);setPage("home");};
  const goShopAll=()=>{setShopFilter("All");setPage("shop");setViewProd(null);updateProductInUrl(null,{replace:true});};
  const goCategory=c=>{setShopFilter(c);setPage("shop");setViewProd(null);updateProductInUrl(null,{replace:true});};
  const logoutCustomer=async()=>{
    try{await authJSON("/api/auth/logout",{method:"POST"});}catch(e){}
    setCustomer(null);
    showToast("Logged out","👤");
    if(page==="account") setPage("home");
  };

  if(page==="adminlogin")return(<><Navbar page="admin" setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={false} logoutAdmin={logout} customer={customer} logoutCustomer={logoutCustomer}/><AdminLogin onLogin={()=>{setAdminAuth(true);setPage("admin");}}/></>);
  if(page==="success"&&sucOrder)return(<><Navbar page="shop" setPage={setPage2} cartCount={0} openCart={()=>{}} isAdmin={adminAuth} logoutAdmin={logout} customer={customer} logoutCustomer={logoutCustomer}/><OrderSuc order={sucOrder} onContinue={()=>{setPage("shop");setSucOrder(null);}}/></>);
  if(page==="account")return(<><Navbar page="account" setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={adminAuth} logoutAdmin={logout} customer={customer} logoutCustomer={logoutCustomer}/><AccountPage customer={customer} onAuth={handleAuth} onLogout={logoutCustomer}/>{toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}</>);
  if(page==="admin")return(<><Navbar page="admin" setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={adminAuth} logoutAdmin={logout} customer={customer} logoutCustomer={logoutCustomer}/><AdminPanel products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} promos={promos} setPromos={setPromos} onViewProduct={(p)=>openProduct(p)} theme={theme} onThemeChange={updateTheme} themeSaving={themeSaving} themeStatus={themeStatus}/>{toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}</>);
  if(checkout)return(<><Navbar page="shop" setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={adminAuth} logoutAdmin={logout} customer={customer} logoutCustomer={logoutCustomer}/><Checkout cart={cart} coupon={coupon} onPlace={placeOrder} onBack={()=>{setCheckout(false);setCartOpen(true);}} customer={customer}/></>);
  return(
    <>
      <Navbar page={page} setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={adminAuth} logoutAdmin={logout} customer={customer} logoutCustomer={logoutCustomer}/>
      {viewProd
        ?<ProdDetail product={viewProd} onBack={()=>closeProduct()} onAddToCart={addToCart}/>
        :page==="home"
          ?<HomePage products={products} promos={promos} onView={openProduct} onAddToCart={addToCart} loading={productsLoading} onShopAll={goShopAll} onCategory={goCategory}/>
          :<ShopPage products={products} promos={promos} onView={openProduct} onAddToCart={addToCart} loading={productsLoading} filter={shopFilter} setFilter={setShopFilter}/>
      }
      {cartOpen&&<CartSide cart={cart} onClose={()=>setCartOpen(false)} updateQty={updateQty} removeItem={removeItem} onCheckout={()=>{setCartOpen(false);setCheckout(true);}} coupon={coupon} setCoupon={setCoupon} promos={promos}/>}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>
      }
    </>
  );
}
