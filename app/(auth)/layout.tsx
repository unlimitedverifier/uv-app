import Content from "@/components/content";

export default function UnauthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Content>{children}</Content>
    </div>
  );
}
