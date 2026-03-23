import Header from "@/components/Header";
import VideoUploader from "@/components/VideoUploader";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <VideoUploader />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;