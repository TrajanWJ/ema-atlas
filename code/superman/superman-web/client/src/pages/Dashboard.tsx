import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, RefreshCw, X } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { HealthGauge } from '../components/HealthGauge';
import { useStore } from '../store/useStore';
import { useEngine } from '../hooks/useEngine';

export default function Dashboard() {
  const { projects } = useStore();
  const { fetchProjects, analyzeProject } = useEngine();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const handleAddProject = async () => {
    if (!path) return;
    setLoading(true);
    const project = await analyzeProject(path, name || path.split('/').pop() || 'Untitled');
    setLoading(false);
    setShowAddModal(false);
    setPath('');
    setName('');
    if (project) navigate(`/project/${project.id}`);
  };

  const totalFiles = projects.reduce((s, p) => s + (p.file_count || 0), 0);
  const totalGaps = projects.reduce((s, p) => s + (p.gap_count || 0), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/20 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Projects', value: projects.length },
          { label: 'Files Analyzed', value: totalFiles },
          { label: 'Total Gaps', value: totalGaps },
          { label: 'Avg Health', value: projects.length ? Math.round(projects.reduce((s, p) => s + (p.health_score || 0), 0) / projects.length) : 0 },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-4">
            <p className="text-xs text-muted mb-1">{stat.label}</p>
            <p className="text-2xl font-bold font-mono">{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-muted/30 mb-4" />
          <p className="text-muted mb-2">No projects yet</p>
          <p className="text-xs text-muted/60">Click "Add Project" to analyze a codebase</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard
                hoverable
                className="p-5"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <h3 className="text-sm font-semibold mb-0.5">{project.name}</h3>
                <p className="text-xs text-muted truncate mb-4">{project.path}</p>

                <div className="flex justify-center mb-3">
                  <HealthGauge score={project.health_score || 0} size={120} />
                </div>

                <div className="grid grid-cols-4 gap-2 text-center mb-3">
                  {[
                    { label: 'Files', value: project.file_count },
                    { label: 'Functions', value: project.function_count },
                    { label: 'Flows', value: project.flow_count },
                    { label: 'Gaps', value: project.gap_count },
                  ].map((s, j) => (
                    <div key={j}>
                      <p className="text-sm font-bold font-mono">{s.value || 0}</p>
                      <p className="text-[10px] text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>

                {project.last_analyzed && (
                  <p className="text-[10px] text-muted/50 text-center">
                    Analyzed {new Date(project.last_analyzed).toLocaleDateString()}
                  </p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-white/[0.07] rounded-xl p-6 w-[480px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Add Project</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/5 rounded">
                <X size={18} className="text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Path to repository</label>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/Users/will/Desktop/my-project"
                  className="w-full px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm font-mono focus:outline-none focus:border-cyan/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Project name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Project"
                  className="w-full px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm focus:outline-none focus:border-cyan/50 transition-colors"
                />
              </div>
              <button
                onClick={handleAddProject}
                disabled={!path || loading}
                className="w-full py-2.5 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                {loading ? 'Analyzing...' : 'Analyze Project'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
