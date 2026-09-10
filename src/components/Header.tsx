import { auth } from '@/auth';
import HeaderClient from '@/components/HeaderClient';

/**
 * 顶部导航 - 服务端组件
 * 负责获取登录状态，传递给客户端组件处理交互
 */
export default async function Header() {
  const session = await auth();

  return <HeaderClient user={session?.user || null} />;
}
