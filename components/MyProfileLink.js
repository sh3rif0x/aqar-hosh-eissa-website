import Link from "next/link";
export default function MyProfileLink({ children, ...rest }) {
  return <Link {...rest} href="/profile/me">{children}</Link>;
}
