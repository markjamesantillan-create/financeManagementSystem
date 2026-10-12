import React from "react";

export default function Breadcrumb({ parent, current }) {
  return (
    <div className="breadcrumb">
      <span>Dashboard</span>
      <b>›</b>
      <span>{parent}</span>
      <b>›</b>
      <strong>{current}</strong>
    </div>
  );
}
