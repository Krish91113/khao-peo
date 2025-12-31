import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <nav className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              KHAO PEEO
            </h1>
          </Link>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        <p className="text-xl text-muted-foreground">Get in touch with our team.</p>
      </div>
    </div>
  );
};

export default Contact;
