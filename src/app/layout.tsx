import "./globals.css";

export const metadata = {
  title: "SmartScreens",
  description: "Create and manage your digital signage effortlessly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
          {children}
      </body>
    </html>
  );
}
