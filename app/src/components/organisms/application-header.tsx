import {LuMoon, LuSun} from 'react-icons/lu';
import {Button, Icon} from '@/components/atoms/catalog';
import {useAccess, useTheme} from '@/data/access';
import {Link, useNavigation} from '@/navigation';
import logo from '@/assets/img/tivit-logo-no-bg.png';
export function ApplicationHeader({identifier, onError}: {identifier?: string; onError: (cause: unknown) => void}) {
  const {signOut} = useAccess(); const {light, toggle} = useTheme(); const {navigate} = useNavigation();
  return <header className="workspace-header"><Link href="/workspace"><img src={logo} alt="TIVIT"/><span>PMO</span></Link><div><Link href="/portafolio">Portafolio</Link><span>{identifier}</span><Button variant="ghost" aria-label="Cambiar tema" onClick={toggle}><Icon glyph={light ? LuMoon : LuSun}/></Button><Button variant="ghost" onClick={() => {void signOut().then(() => navigate('/login', true)).catch(onError);}}>Cerrar sesión</Button></div></header>;
}
