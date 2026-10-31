import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./Reports.css";

const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [supplies, setSupplies] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const bookingSnap = await getDocs(collection(db, "bookings"));
    const vendorSnap = await getDocs(collection(db, "vendors"));
    const inventorySnap = await getDocs(collection(db, "inventory"));
    const suppliesSnap = await getDocs(collection(db, "supplies"));

    setBookings(bookingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setVendors(vendorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setInventory(inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setSupplies(suppliesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const totalRevenue = bookings.reduce(
    (sum, b) => sum + Number(b.totalPrice || 0),
    0
  );

  const totalPaid = bookings.reduce(
    (sum, b) => sum + Number(b.amountPaid || 0),
    0
  );

  const totalBalance = totalRevenue - totalPaid;

  return (
    <div className="reports-page">
      <h2>📊 Reports</h2>

      <div className="report-cards">
        <div className="card">
          <h3>Total Weddings</h3>
          <p>{bookings.length}</p>
        </div>

        <div className="card">
          <h3>Total Revenue</h3>
          <p>Rs. {totalRevenue.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Amount Paid</h3>
          <p>Rs. {totalPaid.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Outstanding</h3>
          <p>Rs. {totalBalance.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Approved Vendors</h3>
          <p>{vendors.filter(v => v.approved).length}</p>
        </div>

        <div className="card">
          <h3>Inventory Items</h3>
          <p>{inventory.length}</p>
        </div>

        <div className="card">
          <h3>Supplies</h3>
          <p>{supplies.length}</p>
        </div>
      </div>

      <h3>Wedding Bookings</h3>

      <table className="report-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Date</th>
            <th>Vendor</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.clientName}</td>
              <td>{b.weddingDate}</td>
              <td>{b.vendorName}</td>
              <td>Rs. {Number(b.amountPaid || 0).toLocaleString()}</td>
              <td>
                Rs.{" "}
                {(
                  Number(b.totalPrice || 0) -
                  Number(b.amountPaid || 0)
                ).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;