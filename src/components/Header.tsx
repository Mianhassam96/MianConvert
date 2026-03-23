import { Video } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] py-6 px-4 mb-6">
      <div className="max-w-4xl mx-auto text-center space-y-3">
        <div className="flex items-center justify-center mb-2">
          <Video className="w-8 h-8 text-white mr-2 animate-pulse" />
          <h1 className="text-3xl font-bold text-white tracking-tight animate-[bounce_1s_ease-in-out_infinite]">
            MutiMian
          </h1>
        </div>
        <p className="text-lg text-purple-100 max-w-2xl mx-auto">
          Transform your videos with powerful tools and seamless sharing
        </p>
        <div className="h-0.5 w-16 bg-white/30 mx-auto rounded-full" />
      </div>
    </header>
  );
};

export default Header;