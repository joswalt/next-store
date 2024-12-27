import { APP_NAME } from "@/lib/constants";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="p-5 flex-center">
        <span className="text-sm text-gray-500">
          &copy; {currentYear} {APP_NAME}. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
