import React, {useEffect, useState} from "react";
import "./Inventory.css";
import {useNavigate, useLocation} from "react-router-dom";
import {collection,addDoc,getDocs,deleteDoc,doc,updateDoc} from "firebase/firestore";
import {db} from "../../firebase";

function Inventory(){
const [inventoryQty, setInventoryQty] = useState("");
const [location, setLocation] = useState("");
const [status, setStatus] = useState("Available");
const [notes, setNotes] = useState("");
const pageLocation = useLocation();
const navigate = useNavigate();
const [activeTab,setActiveTab] = useState("inventory");

useEffect(()=>{
const params = new URLSearchParams(pageLocation.search);
const tab=params.get("tab");
if(tab==="supplies"){setActiveTab("supplies");}
else{setActiveTab("inventory");}
},[pageLocation]);

const [items,setItems]=useState([]);
const [supplies,setSupplies]=useState([]);

// COMMON NAME
const [name,setName]=useState("");

// SUPPLY STATES
const [qty,setQty]=useState("");
const [supplierName,setSupplierName]=useState("");
const [company,setCompany]=useState("");
const [phone,setPhone]=useState("");
const [email,setEmail]=useState("");
const [deliveryDate,setDeliveryDate]=useState("");
const [supplyStatus,setSupplyStatus]=useState("Ordered");
const [supplyNotes,setSupplyNotes]=useState("");

// EDIT ID
const [editId,setEditId]=useState(null);

// LOAD DATA

useEffect(()=>{
loadInventory();
loadSupplies();
},[]);

const loadInventory=async()=>{
const snap=await getDocs(
collection(db,"inventory"));

setItems(snap.docs.map(d=>({id:d.id,...d.data()}))
);
};

const loadSupplies=async()=>{
const snap=await getDocs(
collection(db,"supplies")
);



setSupplies(
snap.docs.map(d=>({
id:d.id,
...d.data()
}))
);
};

// SAVE INVENTORY

const saveInventory=async()=>{
if(!name)return;
if(editId){
await updateDoc(
doc(db,"inventory",editId),
{name,qty:Number(inventoryQty),location,status,notes,createdAt:new Date()}
);

}
else{
await addDoc(
collection(db,"inventory"),
{
name,
qty:Number(inventoryQty),
location,
status,
notes,
createdAt:new Date()
}
);
}

setName("");
setInventoryQty("");
setLocation("");
setStatus("Available");
setNotes("");
setEditId(null);

loadInventory();
};

// SAVE SUPPLY
const saveSupply=async()=>{
if(!name)return;

if(editId){

await updateDoc(

doc(db,"supplies",editId),

{
name,
qty:Number(qty),
supplierName,
company,
phone,
email,
deliveryDate,
status:supplyStatus,
notes:supplyNotes
}
);

}
else{

await addDoc(
collection(db,"supplies"),
{name,qty:Number(qty),supplierName,company,phone,email,deliveryDate,status:supplyStatus,notes:supplyNotes}
);
}

setName("");
setQty("");
setSupplierName("");
setCompany("");
setPhone("");
setEmail("");
setDeliveryDate("");
setSupplyStatus("Ordered");
setSupplyNotes("");
setEditId(null);
loadSupplies();
};



const removeItem=async(collectionName,id)=>{

await deleteDoc(
doc(db,collectionName,id)
);

if(collectionName==="inventory"){
loadInventory();
}
else{
loadSupplies();
}
};
return(
<div className="inventory-page">
<div className="inv-top-bar">

<button
className="inv-vendor-btn"
onClick={()=>navigate("/admin-dashboard")}
>
⬅ Back Dashboard
</button>
</div>





<h1 className="inv-title">📦 Inventory & Supplies</h1>
<p className="inv-subtitle">Manage wedding items</p>

<div className="inv-tab-switcher">
<button
className={
activeTab==="inventory"
?
"inv-tab-btn active"
:
"inv-tab-btn"
}

onClick={()=>setActiveTab("inventory")}
>

📦 Inventory
</button>

<button

className={
activeTab==="supplies"
?
"inv-tab-btn active"
:
"inv-tab-btn"
}
onClick={()=>setActiveTab("supplies")}
>
🛒 Supplies
</button>
</div>

<div className="inv-center-box">

{/* ================= INVENTORY TAB ================= */}

{
activeTab==="inventory" &&
<>

<h2>
Inventory Details
</h2>
<div className="add-box">

<input
placeholder="Inventory Name"
value={name}
onChange={(e)=>setName(e.target.value)}
 />

<input
type="number"
placeholder="Quantity"
value={inventoryQty}
onChange={(e)=>setInventoryQty(e.target.value)}
 />



<input placeholder="Location (Store / Client Venue)"
value={location}
onChange={(e)=>setLocation(e.target.value)} />

<select value={status}
onChange={(e)=>setStatus(e.target.value)}>
<option>Available</option>
<option>In Use</option>
<option>Maintenance</option>
</select>

<input placeholder="Notes" value={notes} onChange={(e)=>setNotes(e.target.value)}/>

<button onClick={saveInventory}>
{
editId
?
"Update"
:
"Add"
}
</button>
</div>

{
items.map((item)=>(
<div className="item-card" key={item.id}>
<div className="item-info">

<h3>
{item.name}
</h3>

<p>
Quantity: {item.qty}
</p>

<p>
Location: {item.location}
</p>


<p>
Status: {item.status}
</p>

<p>
Notes: {item.notes}
</p>

</div>
<div className="item-actions">

<button
onClick={()=>{
setName(item.name);
setInventoryQty(item.qty || "");
setLocation(item.location || "");
setStatus(item.status || "Available");
setNotes(item.notes || "");
setEditId(item.id);

}}
>
Edit
</button>

<button onClick={()=>removeItem("inventory",item.id)}
>Delete</button>
</div>
</div>
))
}

</>
}


{/* ================= SUPPLY TAB ================= */}
{activeTab==="supplies" &&
<>

<h2>Supply Details</h2>
<div className="add-box">

<input
placeholder="Supply Name"
value={name}
onChange={(e)=>setName(e.target.value)}
 />

<input
type="number"
placeholder="Quantity"
value={qty}
onChange={(e)=>setQty(e.target.value)}
 />

<input
placeholder="Supplier Name"
value={supplierName}
onChange={(e)=>setSupplierName(e.target.value)}
 />

<input
placeholder="Company"
value={company}
onChange={(e)=>setCompany(e.target.value)}

 />
<input
placeholder="Phone"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
 />

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
 />

<input
type="date"
value={deliveryDate}
onChange={(e)=>setDeliveryDate(e.target.value)}
 />

<select
value={supplyStatus}
onChange={(e)=>setSupplyStatus(e.target.value)}>

<option>Ordered</option>
<option>Delivered</option>
<option>Pending</option>
</select>

<input
placeholder="Notes"
value={supplyNotes}
onChange={(e)=>setSupplyNotes(e.target.value)}/>

<button onClick={saveSupply}>
{editId ? "Update":"Add"}
</button>
</div>

{
supplies.map((item)=>(
<div className="item-card" key={item.id}>
<div className="item-info">
<h3>{item.name}</h3>
<p>Quantity: {item.qty}</p>
<p>Supplier: {item.supplierName}</p>
<p>Company: {item.company}</p>
<p>Phone: {item.phone}</p>
<p>Email: {item.email}</p>
<p>Delivery Date: {item.deliveryDate}</p>
<p>Status: {item.status}</p>
<p>Notes: {item.notes}</p>

</div>
<div className="item-actions">
<button
onClick={()=>{
setName(item.name);
setQty(item.qty || "");
setSupplierName(item.supplierName || "");
setCompany(item.company || "");
setPhone(item.phone || "");
setEmail(item.email || "");
setDeliveryDate(item.deliveryDate || "");
setSupplyStatus(item.status || "Ordered");
setSupplyNotes(item.notes || "");
setEditId(item.id); }} > Edit </button>

<button onClick={()=>removeItem("supplies",item.id)} > Delete </button> </div>
</div>
))
}
</>
}
</div>
</div>
);
}

export default Inventory;