import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolTabs from "@/components/ToolTabs";

const Index = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <Header />
    <main className="flex-grow px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Video Toolkit</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            7 powerful tools. 100% in your browser. Powered by FFmpeg — nothing leaves your device.
          </p>
        </div>
        <ToolTabs />
      </div>
    </main>
    <Footer />
  </div>
);

export default Index;
