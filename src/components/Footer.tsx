const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-2">MutiMian</h2>
        <p className="text-blue-100">
          Transforming your video experience, one file at a time
        </p>
        <div className="mt-4 text-sm text-blue-200">
          © {new Date().getFullYear()} MutiMian. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;