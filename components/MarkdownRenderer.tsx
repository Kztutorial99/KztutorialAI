import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal, XCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper untuk memilih icon berdasarkan teks judul
  const getHeaderIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('error') || lower.includes('masalah') || lower.includes('typo')) 
      return <XCircle className="text-red-500" size={20} />;
    if (lower.includes('solution') || lower.includes('solusi') || lower.includes('fix')) 
      return <CheckCircle2 className="text-emerald-500" size={20} />;
    if (lower.includes('warning') || lower.includes('catatan')) 
      return <AlertTriangle className="text-amber-500" size={20} />;
    return <Info className="text-blue-400" size={20} />;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // UPDATE: [&>*:last-child]:!mb-0 memastikan elemen terakhir tidak punya margin bawah
      className="w-full text-slate-300 [&>*:first-child]:mt-0 [&>*:last-child]:!mb-0" 
      components={{
        // Paragraf
        p: ({node, ...props}) => <p className="mb-5 leading-loose text-slate-300" {...props} />,

        // --------------------------------------------------------
        // MAGIC HEADER: Ganti Emoji dengan Lucide Icon disini
        // --------------------------------------------------------
        h3: ({node, children, ...props}) => {
          // Ambil teks dari children untuk dicek
          const textContent = String(children);
          return (
            <h3 className="text-base font-bold text-slate-100 mt-4 mb-2 flex items-center gap-2" {...props}>
              {getHeaderIcon(textContent)} {/* Icon Otomatis */}
              <span className={
                textContent.toLowerCase().includes('error') ? 'text-red-400' :
                textContent.toLowerCase().includes('solusi') ? 'text-emerald-400' : 'text-purple-400'
              }>
                {children}
              </span>
            </h3>
          );
        },
        
        // Handle h1 & h2 juga jika perlu
        h2: ({node, children, ...props}) => (
           <h2 className="text-lg font-bold text-white mt-5 mb-3 flex items-center gap-2 border-b border-slate-700 pb-2" {...props}>
              {getHeaderIcon(String(children))}
              {children}
           </h2>
        ),

        // List
        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 marker:text-slate-600" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 marker:text-slate-600" {...props} />,
        li: ({node, ...props}) => <li className="pl-1" {...props} />,

        // Code Block (Design Terminal Modern)
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          const index = Math.random(); 

          return !inline && match ? (
            <div className="relative group rounded-xl overflow-hidden border border-slate-700/60 bg-[#0d1117] my-3 shadow-lg max-w-full">
              <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-700/50">
                 <div className="flex gap-2 items-center">
                   <Terminal size={14} className="text-blue-400" />
                   <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">{match[1]}</span>
                </div>
                <button 
                  onClick={() => handleCopy(codeString, index)} 
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                >
                  {copiedIndex === index ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent', fontSize: '0.9rem', overflowX: 'auto' }}
                wrapLongLines={false}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          ) : (
            // Inline Code style
            <code className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-700" {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;