import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Building2, Users } from 'lucide-react';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ orgs: 0, users: 0, webinars: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      // In a real app, this would be a secure Edge Function call or use an admin role
      const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: webinarCount } = await supabase.from('webinars').select('*', { count: 'exact', head: true });
      
      setStats({
        orgs: orgCount || 0,
        users: userCount || 0,
        webinars: webinarCount || 0
      });
      setLoading(false);
    };

    fetchAdminStats();
  }, []);

  if (loading) return <div className="spinner spinner-lg mt-10 ml-10" />;

  return (
    <div className="admin-page p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={32} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-gray-500 text-sm">Visão global do sistema (Super Admin)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 flex items-center gap-4">
          <div className="bg-primary-100 text-primary-700 p-3 rounded-xl"><Building2 size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Organizações</p>
            <p className="text-3xl font-bold">{stats.orgs}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="bg-success-100 text-success-700 p-3 rounded-xl"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Usuários Totais</p>
            <p className="text-3xl font-bold">{stats.users}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="bg-warning-100 text-warning-700 p-3 rounded-xl"><Shield size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Webinários</p>
            <p className="text-3xl font-bold">{stats.webinars}</p>
          </div>
        </div>
      </div>
      
      <div className="card p-6 text-center text-gray-500">
        Gerenciamento avançado de Organizações e Usuários será implementado aqui.
      </div>
    </div>
  );
}
