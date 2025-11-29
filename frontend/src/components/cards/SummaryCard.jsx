const SummaryCard = ({ title, value }) => {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "10px",
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h4 style={{ marginBottom: "0.5rem" }}>{title}</h4>
      <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{value}</p>
    </div>
  );
};

export default SummaryCard;
