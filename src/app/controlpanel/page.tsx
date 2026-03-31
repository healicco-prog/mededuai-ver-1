import { redirect } from 'next/navigation';

export default function ControlPanelLoginPage() {
    // We now enforce real authentication for Administrative accounts
    // by using the central login page where Katake Pradeep & Dr. Narayana K 
    // can enter their credentials.
    redirect('/login');
}
