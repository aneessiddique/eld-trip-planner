import React from "react";

function LogSheetViewer({ hosLog }) {
  if (!hosLog || hosLog.length === 0) {
    return <div style={{ marginTop: "24px" }}>No HOS log entries yet.</div>;
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <h2>ELD Log Sheet</h2>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
            <th>Hours</th>
            <th>Description</th>
            <th>Miles</th>
          </tr>
        </thead>
        <tbody>
          {hosLog.map((entry, index) => (
            <tr key={index}>
              <td>{entry.status}</td>
              <td>{new Date(entry.start_time).toLocaleString()}</td>
              <td>{new Date(entry.end_time).toLocaleString()}</td>
              <td>{entry.duration_hours}</td>
              <td>{entry.description}</td>
              <td>{entry.miles}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LogSheetViewer;
