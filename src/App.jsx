import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_CREDS = { username: "admin", password: "ministain2025" };
const DHAKA_AREAS = ["Dhaka","Gazipur","Narayanganj","Manikganj","Narsingdi","Munshiganj"];
const DISTRICTS = ["Dhaka","Gazipur","Narayanganj","Manikganj","Narsingdi","Munshiganj","Chittagong","Rajshahi","Khulna","Sylhet","Barisal","Rangpur","Mymensingh","Comilla","Cox's Bazar","Noakhali","Feni","Lakshmipur","Chandpur","Brahmanbaria","Bogura","Pabna","Sirajganj","Natore","Naogaon","Jessore","Satkhira","Bagerhat","Meherpur","Chuadanga","Jhenaidah","Faridpur","Madaripur","Shariatpur","Rajbari","Gopalganj","Tangail","Kishoreganj","Netrokona","Jamalpur","Sherpur","Sunamganj","Habiganj","Moulvibazar","Patuakhali","Pirojpur","Jhalokati","Bhola","Barguna","Kurigram","Lalmonirhat","Nilphamari","Panchagarh","Thakurgaon","Dinajpur","Joypurhat","Gaibandha","Kushtia"];
const INITIAL_PROMOS = [
  { id:1, code:"WELCOME10", type:"percent", value:10, minOrder:500, active:true, label:"10% Off Welcome Discount" },
  { id:2, code:"SAVE100", type:"flat", value:100, minOrder:1000, active:true, label:"৳100 Flat Discount" },
  { id:3, code:"FREESHIP", type:"freeship", value:0, minOrder:0, active:true, label:"Free Shipping" },
];
const INIT_PRODUCTS = [
  { id:1, name:"Solar Eclipse Ring", price:899, originalPrice:1299, category:"Rings", description:"Handcrafted 316L stainless steel ring with mirror-polished finish. Hypoallergenic, tarnish-free, and waterproof.", variants:[{ label:"Silver", color:"#C0C0C0", images:["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600","https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600","https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600"] },{ label:"Gold Tone", color:"#D4AF37", images:["https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600","https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600","https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600"] },{ label:"Rose Gold", color:"#B76E79", images:["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600","https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600","https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600"] }], sizes:["5","6","7","8","9","10"], stock:25, tags:["bestseller"], salePercent:0 },
  { id:2, name:"Celestial Chain Necklace", price:1199, originalPrice:1699, category:"Necklaces", description:"Delicate 18-inch stainless steel chain with a star pendant. Corrosion-resistant, perfect for everyday wear.", variants:[{ label:"Silver", color:"#C0C0C0", images:["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600","https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600","https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=600"] },{ label:"Gold Tone", color:"#D4AF37", images:["https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600","https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600","https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600"] }], sizes:[], stock:40, tags:["new"], salePercent:0 },
  { id:3, name:"Arc Cuff Bracelet", price:749, originalPrice:999, category:"Bracelets", description:"Bold geometric cuff bracelet from surgical-grade stainless steel. Adjustable, scratch-resistant brushed finish.", variants:[{ label:"Silver", color:"#C0C0C0", images:["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600","https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600","https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600"] },{ label:"Black Steel", color:"#2A2A2A", images:["https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=600","https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600","https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"] }], sizes:[], stock:18, tags:["sale"], salePercent:25 },
  { id:4, name:"Helix Stud Earrings", price:549, originalPrice:799, category:"Earrings", description:"Minimalist twisted stud earrings in 316L stainless steel. Nickel-free posts with butterfly backs.", variants:[{ label:"Silver", color:"#C0C0C0", images:["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600","https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=600","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600"] },{ label:"Rose Gold", color:"#B76E79", images:["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600","https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600","https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600"] }], sizes:[], stock:55, tags:["bestseller"], salePercent:0 },
  { id:5, name:"Infinity Link Bracelet", price:849, originalPrice:1099, category:"Bracelets", description:"Elegant infinity link bracelet from premium stainless steel. Adjustable chain, resistant to sweat and water.", variants:[{ label:"Silver", color:"#C0C0C0", images:["https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600","https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=600","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600"] },{ label:"Gold Tone", color:"#D4AF37", images:["https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600","https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600","https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"] }], sizes:[], stock:30, tags:["new"], salePercent:0 },
  { id:6, name:"Sovereign Pendant", price:1499, originalPrice:1999, category:"Necklaces", description:"Statement pendant necklace with interlocking circles on a 20-inch box chain. IP plating for lasting color.", variants:[{ label:"Silver", color:"#C0C0C0", images:["https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=600","https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600","https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600"] },{ label:"Gold Tone", color:"#D4AF37", images:["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600","https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600","https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600"] },{ label:"Black Steel", color:"#2A2A2A", images:["https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=600","https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600","https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600"] }], sizes:[], stock:22, tags:["featured"], salePercent:15 },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#0A0A0A;--s:#111;--s2:#181818;--s3:#202020;--b:rgba(255,255,255,.07);--b2:rgba(255,255,255,.12);--g:#C8A94C;--g2:#E8CC7A;--t:#F2EDE5;--m:#7A7A7A;--m2:#555;--red:#D95B5B;--grn:#5AB88A;--blu:#5B8DD9;--r:10px;--r2:16px;--fd:'Cormorant Garamond',serif;--fb:'Inter',sans-serif;--sh:0 20px 60px rgba(0,0,0,.6);} 
body{font-family:var(--fb);background:var(--bg);color:var(--t);-webkit-font-smoothing:antialiased;}
button{cursor:pointer;border:none;font-family:var(--fb);} 
input,select,textarea{font-family:var(--fb);} 
a{text-decoration:none;color:inherit;} 
img{display:block;} 
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--s);}::-webkit-scrollbar-thumb{background:var(--b2);} 
.nav{position:sticky;top:0;z-index:100;background:rgba(10,10,10,.96);backdrop-filter:blur(24px);border-bottom:1px solid var(--b);height:64px;padding:0 5%;display:flex;align-items:center;justify-content:space-between;} 
.nlogo{font-family:var(--fd);font-size:1.7rem;font-weight:700;letter-spacing:.06em;background:linear-gradient(135deg,var(--g),var(--g2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;cursor:pointer;} 
.nright{display:flex;align-items:center;gap:8px;} 
.nbtn{padding:8px 16px;border-radius:50px;font-size:.82rem;font-weight:500;background:none;color:var(--m);transition:color .2s;letter-spacing:.04em;} 
.nbtn:hover,.nbtn.on{color:var(--g);} 
.ncart{position:relative;display:flex;align-items:center;gap:8px;padding:8px 18px;border-radius:50px;background:var(--s2);border:1px solid var(--b);color:var(--t);font-size:.82rem;font-weight:500;transition:all .2s;} 
.ncart:hover{border-color:var(--g);color:var(--g);} 
.nbadge{position:absolute;top:-5px;right:-5px;background:var(--g);color:var(--bg);font-size:.6rem;font-weight:700;width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;} 
.pb{background:linear-gradient(135deg,var(--g),#B8922A);color:var(--bg);padding:10px;text-align:center;font-size:.78rem;font-weight:600;letter-spacing:.05em;} 
.hero{min-height:88vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:80px 5%;position:relative;overflow:hidden;background:radial-gradient(ellipse 80% 60% at 50% 50%,#13100A 0%,#0A0A0A 100%);} 
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 50% 40% at 50% 30%,rgba(200,169,76,.07) 0%,transparent 70%);} 
.hero-in{position:relative;z-index:1;max-width:720px;} 
.hpill{display:inline-flex;align-items:center;gap:8px;background:rgba(200,169,76,.08);border:1px solid rgba(200,169,76,.25);border-radius:50px;padding:6px 18px;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--g);margin-bottom:28px;} 
.hero h1{font-family:var(--fd);font-size:clamp(2.8rem,6.5vw,5.5rem);font-weight:700;line-height:1.08;margin-bottom:22px;} 
.hero h1 em{font-style:italic;color:var(--g);} 
.hero p{font-size:1.05rem;color:var(--m);line-height:1.75;margin-bottom:36px;max-width:520px;margin-left:auto;margin-right:auto;} 
.hacts{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;} 
.bg{background:linear-gradient(135deg,var(--g),#B8922A);color:var(--bg);font-weight:700;font-size:.875rem;padding:13px 30px;border-radius:50px;letter-spacing:.04em;transition:all .3s;} 
.bg:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(200,169,76,.35);} 
.bgh{background:transparent;color:var(--t);font-weight:500;font-size:.875rem;padding:13px 30px;border-radius:50px;letter-spacing:.04em;border:1px solid var(--b2);transition:all .2s;} 
.bgh:hover{border-color:var(--g);color:var(--g);} 
.bsm{padding:8px 18px;font-size:.78rem;border-radius:8px;} 
.bdanger{background:rgba(217,91,91,.12);border:1px solid rgba(217,91,91,.3);color:var(--red);font-size:.78rem;padding:7px 14px;border-radius:7px;font-weight:500;transition:all .2s;} 
.bdanger:hover{background:rgba(217,91,91,.25);} 
.bsuc{background:rgba(90,184,138,.12);border:1px solid rgba(90,184,138,.3);color:var(--grn);font-size:.78rem;padding:7px 14px;border-radius:7px;font-weight:500;transition:all .2s;} 
.bsm2{background:var(--s2);border:1px solid var(--b);color:var(--t);font-size:.78rem;padding:7px 14px;border-radius:7px;font-weight:500;transition:all .2s;} 
.bsm2:hover{border-color:var(--g);color:var(--g);} 
.sec{padding:72px 5%;} 
.sch{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:36px;flex-wrap:wrap;gap:14px;} 
.stitle{font-family:var(--fd);font-size:2.1rem;font-weight:700;} 
.stitle em{color:var(--g);font-style:italic;} 
.ftabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px;} 
.ftab{padding:7px 18px;border-radius:50px;font-size:.78rem;font-weight:500;background:var(--s2);border:1px solid var(--b);color:var(--m);transition:all .2s;} 
.ftab.on{background:var(--g);border-color:var(--g);color:var(--bg);} 
.ftab:hover:not(.on){border-color:var(--b2);color:var(--t);} 
.sw{position:relative;} 
.sw input{padding:9px 14px 9px 36px;border-radius:50px;background:var(--s2);border:1px solid var(--b);color:var(--t);font-size:.82rem;width:200px;outline:none;transition:border-color .2s;} 
.sw input:focus{border-color:var(--g);} 
.sw input::placeholder{color:var(--m);} 
.sico{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:.85rem;color:var(--m);} 
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:20px;} 
.pcard{background:var(--s);border:1px solid var(--b);border-radius:var(--r2);overflow:hidden;cursor:pointer;transition:all .3s;} 
.pcard:hover{transform:translateY(-5px);border-color:rgba(200,169,76,.3);box-shadow:0 24px 64px rgba(0,0,0,.45);} 
.pimg{aspect-ratio:1;overflow:hidden;position:relative;} 
.pimg img{width:100%;height:100%;object-fit:cover;transition:transform .5s;} 
.pcard:hover .pimg img{transform:scale(1.07);} 
.pbadge{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:4px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;} 
.pb-sale{background:#D95B5B;color:#fff;} 
.pb-new{background:var(--blu);color:#fff;} 
.pb-bestseller{background:var(--g);color:var(--bg);} 
.pb-featured{background:var(--grn);color:#fff;} 
.stag{position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#D95B5B,#B83C3C);color:#fff;font-size:.65rem;font-weight:800;padding:3px 9px;border-radius:50px;} 
.pbody{padding:16px;} 
.pcat{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:var(--blu);margin-bottom:5px;} 
.pname{font-family:var(--fd);font-size:1.1rem;margin-bottom:10px;line-height:1.3;} 
.pprice{display:flex;align-items:center;gap:8px;margin-bottom:12px;} 
.pnow{font-size:1.05rem;font-weight:700;color:var(--g);} 
.pold{font-size:.82rem;text-decoration:line-through;color:var(--m2);} 
.pvars{display:flex;gap:5px;margin-bottom:12px;} 
.vd{width:15px;height:15px;border-radius:50%;border:2px solid transparent;transition:border-color .2s;cursor:pointer;} 
.vd:hover,.vd.on{border-color:var(--g);} 
.qmini{display:flex;align-items:center;gap:6px;margin-bottom:10px;} 
.qmini label{font-size:.72rem;color:var(--m);font-weight:500;} 
.qmc{display:flex;align-items:center;border:1px solid var(--b);border-radius:7px;overflow:hidden;} 
.qmb{width:28px;height:28px;background:var(--s2);color:var(--t);font-size:.95rem;} 
.qmb:hover{background:var(--s3);} 
.qmv{width:34px;height:28px;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:600;} 
.atcbtn{width:100%;padding:11px;border-radius:8px;background:var(--s2);border:1px solid var(--b);color:var(--t);font-size:.82rem;font-weight:600;transition:all .2s;} 
.atcbtn:hover{background:var(--g);border-color:var(--g);color:var(--bg);} 
.dw{max-width:1160px;margin:0 auto;padding:52px 5%;} 
.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:56px;} 
@media(max-width:800px){.dgrid{grid-template-columns:1fr;}} 
.mib{aspect-ratio:1;border-radius:var(--r2);overflow:hidden;background:var(--s);border:1px solid var(--b);position:relative;cursor:zoom-in;user-select:none;} 
.mib img{width:100%;height:100%;object-fit:cover;pointer-events:none;} 
.ztip{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.55);color:var(--m);font-size:.68rem;padding:4px 10px;border-radius:6px;backdrop-filter:blur(4px);} 
.thumbs{display:flex;gap:9px;margin-top:12px;} 
.th{width:68px;aspect-ratio:1;border-radius:8px;overflow:hidden;border:2px solid transparent;cursor:pointer;transition:border-color .2s;flex-shrink:0;} 
.th.on{border-color:var(--g);} 
.th img{width:100%;height:100%;object-fit:cover;} 
.dinfo{display:flex;flex-direction:column;gap:18px;} 
.dcat{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;color:var(--blu);} 
.dname{font-family:var(--fd);font-size:2.3rem;line-height:1.15;font-weight:700;} 
.dprow{display:flex;align-items:center;gap:14px;flex-wrap:wrap;} 
.dprice{font-size:1.9rem;font-weight:700;color:var(--g);} 
.dpold{font-size:1rem;text-decoration:line-through;color:var(--m);} 
.dsave{background:rgba(90,184,138,.12);color:var(--grn);border:1px solid rgba(90,184,138,.25);border-radius:5px;font-size:.72rem;font-weight:700;padding:3px 10px;} 
.ddesc{color:var(--m);line-height:1.8;font-size:.92rem;} 
.dlabel{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--m);margin-bottom:9px;} 
.vbtns{display:flex;gap:8px;flex-wrap:wrap;} 
.vbtn{display:flex;align-items:center;gap:8px;padding:7px 14px;border-radius:8px;background:var(--s2);border:1px solid var(--b);color:var(--t);font-size:.82rem;font-weight:500;transition:all .2s;} 
.vbtn.on{border-color:var(--g);color:var(--g);background:rgba(200,169,76,.07);} 
.vdlg{width:13px;height:13px;border-radius:50%;border:1px solid rgba(255,255,255,.2);} 
.sizes{display:flex;gap:7px;flex-wrap:wrap;} 
.sbtn{width:42px;height:42px;border-radius:8px;background:var(--s2);border:1px solid var(--b);color:var(--t);font-size:.82rem;font-weight:500;transition:all .2s;} 
.sbtn.on{border-color:var(--g);color:var(--g);background:rgba(200,169,76,.07);} 
.qrow{display:flex;align-items:center;gap:14px;} 
.qctrl{display:flex;align-items:center;border:1px solid var(--b);border-radius:9px;overflow:hidden;} 
.qb{width:42px;height:42px;background:var(--s2);color:var(--t);font-size:1.1rem;transition:background .2s;} 
.qb:hover{background:var(--s3);} 
.qv{width:52px;height:42px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;} 
.daddbtn{flex:1;padding:14px;border-radius:10px;background:linear-gradient(135deg,var(--g),#B8922A);color:var(--bg);font-weight:700;font-size:.9rem;transition:all .3s;} 
.daddbtn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(200,169,76,.3);} 
.delinf{display:flex;align-items:flex-start;gap:10px;background:rgba(91,141,217,.07);border:1px solid rgba(91,141,217,.2);border-radius:9px;padding:12px 16px;font-size:.82rem;color:var(--m);} 
.delinf strong{color:var(--t);} 
.feats{display:grid;grid-template-columns:1fr 1fr;gap:9px;} 
.feat{display:flex;align-items:center;gap:9px;background:var(--s2);border:1px solid var(--b);border-radius:8px;padding:10px;} 
.fic{font-size:1.1rem;} 
.ftx{font-size:.77rem;color:var(--m);} 
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:200;animation:fi .2s forwards;} 
@keyframes fi{from{opacity:0;}to{opacity:1;}} 
.cside{position:fixed;top:0;right:0;bottom:0;width:430px;max-width:100vw;background:var(--s);border-left:1px solid var(--b);z-index:201;display:flex;flex-direction:column;animation:si .3s forwards;} 
@keyframes si{from{transform:translateX(110%);}to{transform:translateX(0);}} 
.chd{padding:22px 22px 18px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;} 
.ctitle{font-family:var(--fd);font-size:1.45rem;} 
.xbtn{width:34px;height:34px;border-radius:50%;background:var(--s2);border:1px solid var(--b);color:var(--t);display:flex;align-items:center;justify-content:center;font-size:1rem;} 
.cbody{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;} 
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;color:var(--m);} 
.eico{font-size:3.2rem;} 
.ci{display:flex;gap:12px;background:var(--s2);border:1px solid var(--b);border-radius:var(--r);padding:13px;} 
.ciimg{width:68px;height:68px;border-radius:7px;object-fit:cover;flex-shrink:0;} 
.ciinf{flex:1;min-width:0;} 
.cinm{font-size:.85rem;font-weight:600;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;} 
.civ{font-size:.73rem;color:var(--m);margin-bottom:7px;} 
.cibot{display:flex;align-items:center;justify-content:space-between;} 
.cip{color:var(--g);font-weight:700;font-size:.9rem;} 
.ciq{display:flex;align-items:center;gap:6px;} 
.ciqb{width:26px;height:26px;border-radius:6px;background:var(--s3);border:1px solid var(--b);color:var(--t);font-size:.85rem;} 
.cirm{background:none;color:var(--red);margin-left:4px;font-size:1rem;} 
.cft{padding:18px;border-top:1px solid var(--b);} 
.crow{display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:7px;} 
.crow.big{font-weight:700;font-size:1rem;color:var(--g);padding-top:7px;border-top:1px solid var(--b);} 
.cprow{display:flex;gap:8px;margin-bottom:10px;} 
.cpinp{flex:1;padding:9px 12px;border-radius:8px;background:var(--s2);border:1px solid var(--b);color:var(--t);font-size:.82rem;outline:none;transition:border-color .2s;} 
.cpinp:focus{border-color:var(--g);} 
.cpinp::placeholder{color:var(--m);} 
.capplied{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(90,184,138,.08);border:1px solid rgba(90,184,138,.25);border-radius:8px;font-size:.78rem;color:var(--grn);margin-bottom:10px;} 
.cobtn{padding:9px 16px;border-radius:8px;background:var(--g);color:var(--bg);font-size:.78rem;font-weight:700;} 
.copage{max-width:960px;margin:0 auto;padding:52px 5%;} 
.cogrid{display:grid;grid-template-columns:1.3fr 1fr;gap:36px;} 
@media(max-width:780px){.cogrid{grid-template-columns:1fr;}} 
.cocard{background:var(--s);border:1px solid var(--b);border-radius:var(--r2);padding:26px;margin-bottom:20px;} 
.coctitle{font-family:var(--fd);font-size:1.3rem;margin-bottom:20px;} 
.frow{display:grid;grid-template-columns:1fr 1fr;gap:12px;} 
.fg{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;} 
.fl{font-size:.71rem;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--m);} 
.fi{padding:10px 13px;border-radius:8px;background:var(--s2);border:1px solid var(--b);color:var(--t);font-size:.875rem;outline:none;transition:border-color .2s;width:100%;} 
.fi:focus{border-color:var(--g);} 
.fi::placeholder{color:var(--m);opacity:.5;} 
.fi.err{border-color:var(--red);} 
.etxt{font-size:.7rem;color:var(--red);} 
.payopt{display:flex;align-items:center;gap:14px;padding:14px;border:2px solid var(--b);border-radius:10px;background:var(--s2);} 
.payopt.on{border-color:var(--g);background:rgba(200,169,76,.05);} 
.rc{width:19px;height:19px;border-radius:50%;border:2px solid var(--b);display:flex;align-items:center;justify-content:center;flex-shrink:0;} 
.payopt.on .rc{border-color:var(--g);} 
.rd{width:9px;height:9px;border-radius:50%;background:var(--g);} 
.sumbox{background:var(--s);border:1px solid var(--b);border-radius:var(--r2);padding:22px;position:sticky;top:80px;} 
.sumtitle{font-family:var(--fd);font-size:1.2rem;margin-bottom:16px;} 
.si_{display:flex;gap:11px;margin-bottom:12px;} 
.siimg{width:52px;height:52px;border-radius:7px;object-fit:cover;border:1px solid var(--b);flex-shrink:0;} 
.siinf{flex:1;} 
.sinm{font-size:.82rem;font-weight:500;margin-bottom:2px;} 
.siv{font-size:.72rem;color:var(--m);} 
.sip{font-size:.82rem;color:var(--g);font-weight:600;white-space:nowrap;} 
hr.dv{border:none;border-top:1px solid var(--b);margin:13px 0;} 
.srow{display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:7px;} 
.srow.tot{font-weight:700;font-size:1rem;color:var(--g);} 
.codbox{display:flex;align-items:center;gap:9px;padding:10px 14px;background:rgba(90,184,138,.07);border:1px solid rgba(90,184,138,.22);border-radius:8px;margin-top:12px;font-size:.78rem;color:var(--grn);} 
.pbtn{width:100%;padding:14px;margin-top:16px;border-radius:10px;background:linear-gradient(135deg,var(--g),#B8922A);color:var(--bg);font-weight:700;font-size:.95rem;transition:all .3s;} 
.pbtn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(200,169,76,.3);} 
.sucpage{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center;padding:40px 5%;} 
.sucico{font-size:5rem;margin-bottom:22px;} 
.suctitle{font-family:var(--fd);font-size:2.5rem;margin-bottom:10px;} 
.sucsub{color:var(--m);max-width:500px;line-height:1.75;margin-bottom:28px;} 
.oidbox{background:var(--s);border:1px solid var(--b);border-radius:var(--r);padding:14px 28px;font-family:monospace;font-size:1.05rem;color:var(--g);margin-bottom:28px;} 
.lgpage{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse 60% 50% at 50% 40%,rgba(200,169,76,.06) 0%,transparent 70%);} 
.lgcard{background:var(--s);border:1px solid var(--b);border-radius:var(--r2);padding:44px;width:100%;max-width:420px;margin:20px;} 
.lglogo{font-family:var(--fd);font-size:2rem;font-weight:700;color:var(--g);text-align:center;margin-bottom:6px;} 
.lgsub{text-align:center;color:var(--m);font-size:.82rem;margin-bottom:32px;} 
.lgerr{background:rgba(217,91,91,.1);border:1px solid rgba(217,91,91,.3);color:var(--red);border-radius:8px;padding:10px 14px;font-size:.82rem;margin-bottom:16px;text-align:center;} 
.lgbtn{width:100%;padding:13px;border-radius:10px;background:linear-gradient(135deg,var(--g),#B8922A);color:var(--bg);font-weight:700;font-size:.9rem;margin-top:8px;transition:all .3s;} 
.lgbtn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(200,169,76,.35);} 
.lgft{text-align:center;color:var(--m);font-size:.75rem;margin-top:20px;} 
.awrap{display:flex;min-height:calc(100vh - 64px);} 
.aside{width:228px;background:var(--s);border-right:1px solid var(--b);padding:16px 0;flex-shrink:0;} 
.aslogo{padding:0 20px 16px;font-family:var(--fd);font-size:1rem;color:var(--g);border-bottom:1px solid var(--b);margin-bottom:8px;} 
.aitm{width:100%;padding:11px 20px;display:flex;align-items:center;gap:11px;font-size:.82rem;font-weight:500;color:var(--m);background:none;border:none;text-align:left;transition:all .2s;border-left:3px solid transparent;} 
.aitm:hover,.aitm.on{color:var(--g);background:rgba(200,169,76,.05);border-left-color:var(--g);} 
.amain{flex:1;padding:28px;overflow-y:auto;} 
.ahd{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;} 
.atitle{font-family:var(--fd);font-size:1.7rem;} 
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:14px;margin-bottom:28px;} 
.stc{background:var(--s);border:1px solid var(--b);border-radius:var(--r2);padding:20px;text-align:center;} 
.stv{font-family:var(--fd);font-size:2rem;font-weight:700;color:var(--g);} 
.stl{font-size:.72rem;color:var(--m);text-transform:uppercase;letter-spacing:.08em;margin-top:4px;} 
.tcard{background:var(--s);border:1px solid var(--b);border-radius:var(--r2);overflow:hidden;} 
.tchd{padding:14px 18px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;} 
.tchtitle{font-weight:600;font-size:.9rem;} 
table.t{width:100%;border-collapse:collapse;font-size:.82rem;} 
table.t th{text-align:left;padding:11px 15px;color:var(--m);font-weight:500;font-size:.7rem;text-transform:uppercase;letter-spacing:.07em;border-bottom:1px solid var(--b);} 
table.t td{padding:12px 15px;border-bottom:1px solid var(--b);vertical-align:middle;} 
table.t tr:last-child td{border-bottom:none;} 
table.t tr:hover td{background:var(--s2);} 
.badge{display:inline-block;padding:3px 9px;border-radius:50px;font-size:.68rem;font-weight:700;} 
.bpend{background:rgba(200,169,76,.12);color:var(--g);} 
.bproc{background:rgba(91,141,217,.12);color:var(--blu);} 
.bdel{background:rgba(90,184,138,.12);color:var(--grn);} 
.bcan{background:rgba(217,91,91,.12);color:var(--red);} 
.bcat{background:rgba(91,141,217,.1);color:var(--blu);} 
.bsale{background:rgba(217,91,91,.1);color:var(--red);} 
.bon{background:rgba(90,184,138,.1);color:var(--grn);} 
.boff{background:rgba(122,122,122,.1);color:var(--m);} 
.pthmb{width:44px;height:44px;border-radius:7px;object-fit:cover;border:1px solid var(--b);} 
.tact{display:flex;gap:7px;} 
.mov{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;} 
.mbox{background:var(--s);border:1px solid var(--b);border-radius:var(--r2);width:100%;max-width:640px;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;} 
.mhd{padding:18px 22px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--s);z-index:1;} 
.mtitle{font-family:var(--fd);font-size:1.25rem;} 
.mbody{padding:22px;flex:1;} 
.mft{padding:14px 22px;border-top:1px solid var(--b);display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:var(--s);} 
.iugrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;} 
.iuslot{aspect-ratio:1;border-radius:8px;border:2px dashed var(--b);display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;position:relative;transition:border-color .2s;background:var(--s2);} 
.iuslot:hover{border-color:var(--g);} 
.iuslot img{width:100%;height:100%;object-fit:cover;} 
.iurm{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.7);color:#fff;border-radius:50%;width:20px;height:20px;font-size:.65rem;display:flex;align-items:center;justify-content:center;cursor:pointer;} 
.iuadd{display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--m);font-size:.7rem;} 
.iuadd span{font-size:1.4rem;} 
.pclist{display:flex;flex-direction:column;gap:10px;} 
.pci{background:var(--s2);border:1px solid var(--b);border-radius:var(--r);padding:16px;display:flex;align-items:center;justify-content:space-between;gap:14px;} 
.pcode{font-family:monospace;font-size:1rem;font-weight:700;color:var(--g);} 
.pinf{font-size:.78rem;color:var(--m);margin-top:3px;} 
.toast{position:fixed;bottom:22px;right:22px;z-index:999;background:var(--s);border:1px solid rgba(200,169,76,.4);border-radius:10px;padding:13px 18px;font-size:.835rem;box-shadow:var(--sh);animation:su .3s ease;display:flex;align-items:center;gap:10px;max-width:340px;} 
@keyframes su{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}} 
.footer{background:var(--s);border-top:1px solid var(--b);padding:56px 5% 28px;margin-top:72px;} 
.ftgrid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:36px;margin-bottom:36px;} 
@media(max-width:780px){.ftgrid{grid-template-columns:1fr 1fr;}} 
.ftbrand p{color:var(--m);font-size:.82rem;line-height:1.75;margin-top:11px;} 
.ftcol h4{font-weight:600;font-size:.82rem;margin-bottom:13px;} 
.ftlnk{display:block;color:var(--m);font-size:.8rem;margin-bottom:8px;transition:color .2s;cursor:pointer;} 
.ftlnk:hover{color:var(--g);} 
.ftbot{border-top:1px solid var(--b);padding-top:22px;display:flex;justify-content:space-between;align-items:center;font-size:.75rem;color:var(--m);flex-wrap:wrap;gap:9px;} 
.fbbtn{display:inline-flex;align-items:center;gap:8px;background:#1877F2;color:#fff;padding:7px 16px;border-radius:50px;font-size:.78rem;font-weight:600;margin-top:14px;transition:opacity .2s;} 
.fbbtn:hover{opacity:.85;} 
.backbtn{display:flex;align-items:center;gap:7px;background:none;color:var(--m);font-size:.82rem;padding:0;margin-bottom:22px;transition:color .2s;} 
.backbtn:hover{color:var(--g);} 
.discrow{color:var(--grn);} 
.trubar{background:var(--s);border-top:1px solid var(--b);border-bottom:1px solid var(--b);padding:26px 5%;} 
.trus{display:flex;justify-content:center;gap:clamp(16px,4vw,72px);flex-wrap:wrap;} 
.tri{display:flex;align-items:center;gap:8px;color:var(--m);font-size:.82rem;} 
@media(max-width:600px){.frow{grid-template-columns:1fr;}.dgrid{grid-template-columns:1fr;}.nbtn{display:none;}} 
`;

function injectCSS(){const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);} 
const fmt=n=>"৳"+Number(n).toLocaleString("en-BD");
const genId=()=>"MS-"+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,5).toUpperCase();
const isDhaka=d=>DHAKA_AREAS.includes(d);
const shipFee=(d,cp)=>cp?.type==="freeship"?0:isDhaka(d)?80:120;

// ─── Optional Sync (SQL backend / Odoo) ─────────────────────────────────────
// This frontend works fully offline (localStorage). To sync products/orders,
// point it to YOUR backend (recommended) or an Odoo proxy endpoint.
//
// ✅ Recommended architecture:
//   React (this app) -> Your API (Node/Python) -> SQL + Odoo
//
// Turn on sync by setting enabled:true and baseUrl.
const SYNC_CONFIG = {
  enabled: false,
  baseUrl: "", // e.g. "https://api.yoursite.com"
  endpoints: {
    orders: "/orders",     // POST
    products: "/products", // GET + POST
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

async function syncOrderToBackend(order) {
  if (!SYNC_CONFIG.enabled || !SYNC_CONFIG.baseUrl) return;
  return apiJSON(SYNC_CONFIG.endpoints.orders, { method: "POST", body: JSON.stringify(order) });
}

async function fetchProductsFromBackend() {
  if (!SYNC_CONFIG.enabled || !SYNC_CONFIG.baseUrl) return null;
  return apiJSON(SYNC_CONFIG.endpoints.products, { method: "GET" });
}

async function upsertProductToBackend(product) {
  if (!SYNC_CONFIG.enabled || !SYNC_CONFIG.baseUrl) return;
  return apiJSON(SYNC_CONFIG.endpoints.products, { method: "POST", body: JSON.stringify(product) });
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
            {img?(<><img src={img} alt=""/><div className="iurm" onClick={e=>{e.stopPropagation();const u=[...images];u.splice(i,1);onChange(u);}}>✕</div></>)
              :<div className="iuadd"><span>＋</span>Upload</div>}
          </div>
        ))}
      </div>
    </>
  );
}

// Product Modal
function ProdModal({product,onSave,onClose}){
  const blank={name:"",category:"Rings",price:"",originalPrice:"",stock:"",description:"",sizes:[],tags:[],salePercent:0,variants:[{label:"Silver",color:"#C0C0C0",images:[]}]};
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
          <button className="bg bsm" onClick={()=>{if(!form.name||!form.price)return;onSave({...form,price:+form.price,originalPrice:+form.originalPrice||+form.price,stock:+form.stock||0,salePercent:+form.salePercent||0,id:product?.id||Date.now()});}}>Save Product</button>
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
function Navbar({page,setPage,cartCount,openCart,isAdmin,logoutAdmin}){
  return(
    <nav className="nav">
      <div className="nlogo" onClick={()=>setPage("shop")}>MiniStain</div>
      <div className="nright">
        <button className={`nbtn ${page==="shop"?"on":""}`} onClick={()=>setPage("shop")}>Shop</button>
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
  const[vi,setVi]=useState(0);const[qty,setQty]=useState(1);
  const v=product.variants[vi]||product.variants[0];
  const tag=product.tags?.[0];
  const sale=product.salePercent>0;
  const price=sale?Math.round(product.originalPrice*(1-product.salePercent/100)):product.price;
  const img=v?.images?.[0]||"https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600";
  return(
    <div className="pcard" onClick={()=>onView(product)}>
      <div className="pimg">
        <img src={img} alt={product.name} loading="lazy"/>
        {tag&&<span className={`pbadge pb-${tag}`}>{tag}</span>}
        {sale&&<span className="stag">−{product.salePercent}%</span>}
      </div>
      <div className="pbody">
        <div className="pcat">{product.category}</div>
        <div className="pname">{product.name}</div>
        <div className="pprice"><span className="pnow">{fmt(price)}</span><span className="pold">{fmt(product.originalPrice)}</span></div>
        <div className="pvars">{product.variants.map((vv,i)=><div key={i} className={`vd ${vi===i?"on":""}`} style={{background:vv.color}} onClick={e=>{e.stopPropagation();setVi(i);}}/>)}</div>
        <div className="qmini" onClick={e=>e.stopPropagation()}>
          <label>Qty:</label>
          <div className="qmc"><button className="qmb" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button><div className="qmv">{qty}</div><button className="qmb" onClick={()=>setQty(q=>q+1)}>+</button></div>
        </div>
        <button className="atcbtn" onClick={e=>{e.stopPropagation();onAddToCart(product,vi,qty);}}>Add {qty} to Cart — {fmt(price*qty)}</button>
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
      <img ref={ir} src={src} alt="" style={{transition:z?"none":"transform .35s"}}/>
      {!z&&<div className="ztip">🔍 Hover to zoom</div>}
    </div>
  );
}

// Product Detail
function ProdDetail({product,onBack,onAddToCart}){
  const[vi,setVi]=useState(0);const[ii,setIi]=useState(0);const[size,setSize]=useState(product.sizes?.[0]||"");const[qty,setQty]=useState(1);
  useEffect(()=>setIi(0),[vi]);
  const v=product.variants[vi];
  const sale=product.salePercent>0;
  const price=sale?Math.round(product.originalPrice*(1-product.salePercent/100)):product.price;
  const saved=product.originalPrice-price;
  const img=v?.images?.[ii]||"https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600";
  return(
    <div className="dw">
      <button className="backbtn" onClick={onBack}>← Back to Shop</button>
      <div className="dgrid">
        <div>
          <ZoomImg src={img}/>
          {v?.images?.length>0&&<div className="thumbs">{v.images.map((im,i)=><div key={i} className={`th ${ii===i?"on":""}`} onClick={()=>setIi(i)}><img src={im} alt=""/></div>)}</div>}
        </div>
        <div className="dinfo">
          <div className="dcat">{product.category}</div>
          <div className="dname">{product.name}</div>
          <div className="dprow">
            <span className="dprice">{fmt(price)}</span>
            <span className="dpold">{fmt(product.originalPrice)}</span>
            {sale&&<span className="dsave">−{product.salePercent}% OFF</span>}
            {!sale&&saved>0&&<span className="dsave">Save {fmt(saved)}</span>}
          </div>
          <p className="ddesc">{product.description}</p>
          <div>
            <div className="dlabel">Finish: {v?.label}</div>
            <div className="vbtns">{product.variants.map((vv,i)=><button key={i} className={`vbtn ${vi===i?"on":""}`} onClick={()=>setVi(i)}><span className="vdlg" style={{background:vv.color}}/>{vv.label}</button>)}</div>
          </div>
          {product.sizes?.length>0&&<div><div className="dlabel">Ring Size: {size}</div><div className="sizes">{product.sizes.map(s=><button key={s} className={`sbtn ${size===s?"on":""}`} onClick={()=>setSize(s)}>{s}</button>)}</div></div>}
          <div className="qrow">
            <div className="qctrl"><button className="qb" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button><div className="qv">{qty}</div><button className="qb" onClick={()=>setQty(q=>q+1)}>+</button></div>
            <button className="daddbtn" onClick={()=>onAddToCart(product,vi,qty,size)}>Add {qty} to Cart — {fmt(price*qty)}</button>
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
              <img className="ciimg" src={item.image||"https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200"} alt=""/>
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
function Checkout({cart,coupon,onPlace,onBack}){
  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const disc=coupon?coupon.type==="percent"?Math.round(sub*coupon.value/100):coupon.type==="flat"?coupon.value:0:0;
  const[form,setForm]=useState({firstName:"",lastName:"",phone:"",email:"",address:"",city:"",district:"",notes:""});
  const[errors,setErrors]=useState({});
  const[payment,setPayment]=useState({method:"cod",trx:""});
  const ch=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const ship=shipFee(form.district,coupon);
  const total=sub-disc+ship;

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
                  <img className="siimg" src={item.image||"https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200"} alt=""/>
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
function AdminPanel({products,setProducts,orders,setOrders,promos,setPromos}){
  const[tab,setTab]=useState("dashboard");
  const[eprod,setEprod]=useState(null);const[showAdd,setShowAdd]=useState(false);
  const[epromo,setEpromo]=useState(null);const[showAddP,setShowAddP]=useState(false);
  const[vOrder,setVO]=useState(null);
  const rev=orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.total,0);
  const pend=orders.filter(o=>o.status==="Pending").length;
  const sc={Pending:"bpend",Processing:"bproc",Delivered:"bdel",Cancelled:"bcan"};
  const tabs=[{id:"dashboard",ico:"📊",l:"Dashboard"},{id:"products",ico:"💎",l:"Products"},{id:"orders",ico:"📦",l:"Orders"},{id:"promotions",ico:"🏷️",l:"Promotions"}];
  return(
    <div className="awrap">
      <div className="aside">
        <div className="aslogo">🔧 Admin Panel</div>
        {tabs.map(t=><button key={t.id} className={`aitm ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}><span>{t.ico}</span>{t.l}</button>)}
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
                <tbody>{orders.slice().reverse().slice(0,8).map(o=><tr key={o.orderId}>
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
          <div className="ahd"><div className="atitle">Products ({products.length})</div><button className="bg bsm" onClick={()=>setShowAdd(true)}>+ Add Product</button></div>
          <div className="tcard">
            <table className="t"><thead><tr><th>Photo</th><th>Name</th><th>Category</th><th>Price</th><th>Sale</th><th>Stock</th><th>Actions</th></tr></thead>
              <tbody>{products.map(p=>{const img=p.variants?.[0]?.images?.[0]||"https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200";return(
                <tr key={p.id}>
                  <td><img className="pthmb" src={img} alt=""/></td>
                  <td style={{fontWeight:500}}>{p.name}</td>
                  <td><span className="badge bcat">{p.category}</span></td>
                  <td style={{color:"var(--g)"}}>{fmt(p.price)}</td>
                  <td>{p.salePercent>0?<span className="badge bsale">−{p.salePercent}%</span>:<span style={{color:"var(--m)"}}>—</span>}</td>
                  <td>{p.stock}</td>
                  <td><div className="tact"><button className="bsm2" onClick={()=>setEprod(p)}>Edit</button><button className="bdanger" onClick={()=>setProducts(products.filter(x=>x.id!==p.id))}>Delete</button></div></td>
                </tr>);})}</tbody>
            </table>
          </div>
        </>}
        {/* Orders */}
        {tab==="orders"&&<>
          <div className="ahd"><div className="atitle">Orders ({orders.length})</div></div>
          <div className="tcard">
            {orders.length===0?<div style={{padding:60,textAlign:"center",color:"var(--m)"}}>No orders yet!</div>:(
              <table className="t"><thead><tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>District</th><th>Total</th><th>Pay</th><th>Status</th><th>Update</th></tr></thead>
                <tbody>{orders.slice().reverse().map(o=>(
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
                    <td><select className="fi" style={{padding:"5px 8px",fontSize:".75rem",width:118}} value={o.status} onChange={e=>setOrders(orders.map(x=>x.orderId===o.orderId?{...x,status:e.target.value}:x))}>{["Pending","Processing","Delivered","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>}
        {/* Promotions */}
        {tab==="promotions"&&<>
          <div className="ahd"><div className="atitle">Promotions</div><button className="bg bsm" onClick={()=>setShowAddP(true)}>+ New Promo</button></div>
          <div className="pclist">
            {promos.map(p=>(
              <div key={p.id} className="pci">
                <div><div className="pcode">{p.code}</div><div className="pinf">{p.label} · Min: {p.minOrder?fmt(p.minOrder):"No min"} · {p.type==="freeship"?"Free Ship":p.type==="percent"?`${p.value}% off`:`৳${p.value} off`}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span className={`badge ${p.active?"bon":"boff"}`}>{p.active?"Active":"Off"}</span>
                  <button className="bsm2" onClick={()=>setEpromo(p)}>Edit</button>
                  <button className="bdanger" onClick={()=>setPromos(promos.filter(x=>x.id!==p.id))}>Delete</button>
                </div>
              </div>
            ))}
            {promos.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--m)"}}>No promotions yet</div>}
          </div>
        </>}
      </div>
      {(eprod||showAdd)&&<ProdModal product={eprod||null} onSave={async p=>{if(eprod){setProducts(products.map(x=>x.id===p.id?p:x));setEprod(null);}else{setProducts([...products,p]);setShowAdd(false);}try{await upsertProductToBackend(p);}catch(e){}}} onClose={()=>{setEprod(null);setShowAdd(false);}}/>}
      {(epromo||showAddP)&&<PromoModal promo={epromo||null} onSave={p=>{if(epromo){setPromos(promos.map(x=>x.id===p.id?p:x));setEpromo(null);}else{setPromos([...promos,p]);setShowAddP(false);}}} onClose={()=>{setEpromo(null);setShowAddP(false);}}/>}
      {vOrder&&(
        <div className="mov" onClick={e=>e.target===e.currentTarget&&setVO(null)}>
          <div className="mbox" style={{maxWidth:520}}>
            <div className="mhd"><div className="mtitle">Order Detail</div><button className="xbtn" onClick={()=>setVO(null)}>✕</button></div>
            <div className="mbody">
              <div style={{fontFamily:"monospace",color:"var(--g)",marginBottom:16,fontSize:"1rem"}}>{vOrder.orderId}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[["Customer",`${vOrder.address.firstName} ${vOrder.address.lastName}`],["Phone",vOrder.address.phone],["Payment",`${payLabel(vOrder.payment?.method||"cod")}${vOrder.payment?.trx?" · Trx: "+vOrder.payment.trx:""}`],["Address",vOrder.address.address],["City",vOrder.address.city],["District",vOrder.address.district],["Date",new Date(vOrder.date).toLocaleDateString("en-BD")]].map(([k,v])=><div key={k}><div className="fl">{k}</div><div style={{fontSize:".85rem",marginTop:3}}>{v}</div></div>)}
              </div>
              {vOrder.address.notes&&<div style={{background:"var(--s2)",border:"1px solid var(--b)",borderRadius:8,padding:10,fontSize:".82rem",marginBottom:14}}><b>Notes:</b> {vOrder.address.notes}</div>}
              <hr className="dv"/>
              {vOrder.items.map(i=><div key={i.cartId} className="si_" style={{marginBottom:10}}><img className="siimg" src={i.image||"https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200"} alt=""/><div className="siinf"><div className="sinm">{i.name}</div><div className="siv">{i.variant} · Qty: {i.qty}{i.size?` · Size ${i.size}`:""}</div></div><div className="sip">{fmt(i.price*i.qty)}</div></div>)}
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

// Shop
function Shop({products,promos,onView,onAddToCart}){
  const[filter,setFilter]=useState("All");const[search,setSearch]=useState("");
  const cats=["All","Rings","Necklaces","Bracelets","Earrings"];
  const active=promos.filter(p=>p.active);
  const list=products.filter(p=>(filter==="All"||p.category===filter)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())));
  return(
    <>
      {active.length>0&&<div className="pb">🏷️ {active.map(p=>p.label).join("  ·  ")}  — Use codes at checkout!</div>}
      <div className="hero">
        <div className="hero-in">
          <div className="hpill">✦ Premium Stainless Steel Jewelry</div>
          <h1>Wear <em>Luxury</em><br/>Every Day</h1>
          <p>Handcrafted 316L stainless steel jewelry — hypoallergenic, waterproof, and built to last a lifetime.</p>
          <div className="hacts">
            <button className="bg" onClick={()=>document.getElementById("prods")?.scrollIntoView({behavior:"smooth"})}>Shop Now</button>
            <a className="bgh" href="https://www.facebook.com/profile.php?id=61586131658591" target="_blank" rel="noreferrer">📘 MiniStain Facebook</a>
          </div>
        </div>
      </div>
      <div className="sec" id="prods">
        <div className="sch">
          <h2 className="stitle">Our <em>Collection</em></h2>
          <div className="sw"><span className="sico">🔍</span><input placeholder="Search jewelry..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        </div>
        <div className="ftabs">{cats.map(c=><button key={c} className={`ftab ${filter===c?"on":""}`} onClick={()=>setFilter(c)}>{c}</button>)}</div>
        {list.length===0?<div style={{textAlign:"center",padding:"60px 0",color:"var(--m)"}}>No products found</div>
          :<div className="pgrid">{list.map(p=><ProdCard key={p.id} product={p} onView={onView} onAddToCart={onAddToCart}/>)}</div>}
      </div>
      <div className="trubar"><div className="trus">{[["💧","Waterproof"],["🛡️","316L Steel"],["🚚","Dhaka ৳80 · Others ৳120"],["💵","Cash on Delivery"],["↩️","Easy Returns"]].map(([ic,lb])=><div key={lb} className="tri"><span style={{fontSize:"1.1rem"}}>{ic}</span>{lb}</div>)}</div></div>
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
    </>
  );
}

// App
export default function App(){
  useEffect(()=>{injectCSS();},[]);
  useEffect(()=>{(async()=>{try{const remote=await fetchProductsFromBackend();if(Array.isArray(remote)&&remote.length>0)setProducts(remote);}catch(e){}})();},[]);
  const[products,setProducts]=useLS("ms_products",INIT_PRODUCTS);
  const[orders,setOrders]=useLS("ms_orders",[]);
  const[cart,setCart]=useLS("ms_cart",[]);
  const[promos,setPromos]=useLS("ms_promos",INITIAL_PROMOS);
  const[adminAuth,setAdminAuth]=useLS("ms_admin",false);
  const[coupon,setCoupon]=useState(null);
  const[page,setPage]=useState("shop");
  const[viewProd,setViewProd]=useState(null);
  const[cartOpen,setCartOpen]=useState(false);
  const[checkout,setCheckout]=useState(false);
  const[sucOrder,setSucOrder]=useState(null);
  const[toast,setToast]=useState(null);
  const showToast=(msg,icon="✦")=>setToast({msg,icon});
  const addToCart=(product,vi,qty=1,size="")=>{
    const v=product.variants[vi];
    const sale=product.salePercent>0;
    const price=sale?Math.round(product.originalPrice*(1-product.salePercent/100)):product.price;
    const cartId=`${product.id}-${vi}-${size}`;
    const img=v?.images?.[0]||"";
    setCart(prev=>{const ex=prev.find(i=>i.cartId===cartId);if(ex)return prev.map(i=>i.cartId===cartId?{...i,qty:i.qty+qty}:i);return[...prev,{cartId,id:product.id,name:product.name,price,variant:v.label,image:img,qty,size}];});
    showToast(`${product.name} × ${qty} added!`,`✦`);setCartOpen(true);
  };
  const updateQty=(id,qty)=>{if(qty<1){setCart(p=>p.filter(i=>i.cartId!==id));return;}setCart(p=>p.map(i=>i.cartId===id?{...i,qty}:i));};
  const removeItem=id=>setCart(p=>p.filter(i=>i.cartId!==id));
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const placeOrder=async(data)=>{setOrders(p=>[...p,data]);setCart([]);setCoupon(null);setCheckout(false);setSucOrder(data);setPage("success");
    try{await syncOrderToBackend(data);}catch(e){console.warn(e);showToast("Order saved locally (sync failed)","⚠️");}
  };
  const setPage2=p=>{if(p==="admin"&&!adminAuth){setPage("adminlogin");return;}setPage(p);setViewProd(null);};
  const logout=()=>{setAdminAuth(false);setPage("shop");};

  if(page==="adminlogin")return(<><Navbar page="admin" setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={false} logoutAdmin={logout}/><AdminLogin onLogin={()=>{setAdminAuth(true);setPage("admin");}}/></>);
  if(page==="success"&&sucOrder)return(<><Navbar page="shop" setPage={setPage2} cartCount={0} openCart={()=>{}} isAdmin={adminAuth} logoutAdmin={logout}/><OrderSuc order={sucOrder} onContinue={()=>{setPage("shop");setSucOrder(null);}}/></>);
  if(page==="admin")return(<><Navbar page="admin" setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={adminAuth} logoutAdmin={logout}/><AdminPanel products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} promos={promos} setPromos={setPromos}/>{toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}</>);
  if(checkout)return(<><Navbar page="shop" setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={adminAuth} logoutAdmin={logout}/><Checkout cart={cart} coupon={coupon} onPlace={placeOrder} onBack={()=>{setCheckout(false);setCartOpen(true);}}/></>);
  return(
    <>
      <Navbar page={page} setPage={setPage2} cartCount={cartCount} openCart={()=>setCartOpen(true)} isAdmin={adminAuth} logoutAdmin={logout}/>
      {viewProd?<ProdDetail product={viewProd} onBack={()=>setViewProd(null)} onAddToCart={addToCart}/>:<Shop products={products} promos={promos} onView={setViewProd} onAddToCart={addToCart}/>}
      {cartOpen&&<CartSide cart={cart} onClose={()=>setCartOpen(false)} updateQty={updateQty} removeItem={removeItem} onCheckout={()=>{setCartOpen(false);setCheckout(true);}} coupon={coupon} setCoupon={setCoupon} promos={promos}/>}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>
      }
    </>
  );
}

