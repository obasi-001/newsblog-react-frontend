function Loader({ label = "Loading coverage..." }) {
  return (
    <div className="bg-white border rounded-4 shadow-sm p-5 text-center">
      <div className="spinner-border text-danger" role="status" />
      <p className="text-secondary mb-0 mt-3">{label}</p>
    </div>
  );
}

export default Loader;
