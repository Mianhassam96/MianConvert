import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoConverter from "@/components/VideoConverter";

const Index = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <Header />
    <main className="flex-grow px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Video Converter</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Convert, mute, or extract audio — 100% in your browser. Nothing leaves your device.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <VideoConverter />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Index;
