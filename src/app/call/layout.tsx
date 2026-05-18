interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return <div className="h-screen bg-yellow-400">{children}</div>;
};
export default Layout;
