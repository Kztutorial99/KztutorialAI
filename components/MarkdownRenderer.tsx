
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal, XCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  isTerminal?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isTerminal = false }) => {
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
      return <XCircle className={isTerminal ? "text-red-500" : "text-red-500"} size={20} />;
    if (lower.includes('solution') || lower.includes('solusi') || lower.includes('fix')) 
      return <CheckCircle2 className={isTerminal ? "text-green-500" : "text-emerald-500"} size={20} />;
    if (lower.includes('warning') || lower.includes('catatan')) 
      return <AlertTriangle className="text-amber-500" size={20} />;
    return <Info className={isTerminal ? "text-green-500" : "text-blue-400"} size={20} />;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // UPDATE: Styling dinamis berdasarkan mode
      className={`w-full [&>*:first-child]:mt-0 [&>*:last-child]:!mb-0 ${
        isTerminal ? 'text-green-500 font-mono' : 'text-slate-300'
      }`} 
      components={{
        // Paragraf
        p: ({node, ...props}) => <p className={`mb-5 leading-loose ${isTerminal ? 'text-green-500' : 'text-slate-300'}`} {...props} />,

        // --------------------------------------------------------
        // MAGIC HEADER: Ganti Emoji dengan Lucide Icon disini
        // --------------------------------------------------------
        h3: ({node, children, ...props}) => {
          // Ambil teks dari children untuk dicek
          const textContent = String(children);
          return (
            <h3 className={`text-base font-bold mt-4 mb-2 flex items-center gap-2 ${
              isTerminal 
                ? 'text-green-400 border-b border-green-800 pb-1' 
                : 'text-slate-100'
            }`} {...props}>
              {getHeaderIcon(textContent)} {/* Icon Otomatis */}
              <span className={
                isTerminal 
                  ? 'text-green-400 uppercase tracking-widest' 
                  : (textContent.toLowerCase().includes('error') ? 'text-red-400' :
                     textContent.toLowerCase().includes('solusi') ? 'text-emerald-400' : 'text-purple-400')
              }>
                {children}
              </span>
            </h3>
          );
        },
        
        // Handle h1 & h2 juga jika perlu
        h2: ({node, children, ...props}) => (
           <h2 className={`text-lg font-bold mt-5 mb-3 flex items-center gap-2 border-b pb-2 ${
             isTerminal ? 'text-green-400 border-green-700' : 'text-white border-slate-700'
           }`} {...props}>
              {getHeaderIcon(String(children))}
              {children}
           </h2>
        ),

        // List
        ul: ({node, ...props}) => <ul className={`list-disc pl-5 mb-3 space-y-1 ${isTerminal ? 'marker:text-green-600' : 'marker:text-slate-600'}`} {...props} />,
        ol: ({node, ...props}) => <ol className={`list-decimal pl-5 mb-3 space-y-1 ${isTerminal ? 'marker:text-green-600' : 'marker:text-slate-600'}`} {...props} />,
        li: ({node, ...props}) => <li className="pl-1" {...props} />,

        // Code Block (Design Terminal Modern)
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          const index = Math.random(); 

          return !inline && match ? (
            <div className={`relative group overflow-hidden my-3 shadow-lg max-w-full ${
              isTerminal 
                ? 'rounded-none border-2 border-green-900 bg-black' 
                : 'rounded-xl border border-slate-700/60 bg-[#0d1117]'
            }`}>
              <div className={`flex items-center justify-between px-4 py-2 border-b ${
                isTerminal 
                  ? 'bg-green-900/20 border-green-900' 
                  : 'bg-[#161b22] border-slate-700/50'
              }`}>
                 <div className="flex gap-2 items-center">
                   <Terminal size={14} className={isTerminal ? "text-green-500" : "text-blue-400"} />
                   <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isTerminal ? "text-green-600" : "text-slate-400"}`}>
                     {match[1]}
                   </span>
                </div>
                <button 
                  onClick={() => handleCopy(codeString, index)} 
                  className={`p-1 transition-colors ${
                    isTerminal 
                      ? 'hover:bg-green-900/50 text-green-700 hover:text-green-400' 
                      : 'hover:bg-slate-700 rounded text-slate-400 hover:text-white'
                  }`}
                >
                  {copiedIndex === index ? <Check size={14} className={isTerminal ? "text-green-400" : "text-emerald-400"} /> : <Copy size={14} />}
                </button>
              </div>
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ 
                  margin: 0, 
                  padding: '1.25rem', 
                  background: 'transparent', // Biarkan container menangani background
                  fontSize: '0.9rem', 
                  overflowX: 'auto',
                  fontFamily: '"JetBrains Mono", monospace'
                }}
                wrapLongLines={false}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          ) : (
            // Inline Code style
            <code className={`${
              isTerminal
                ? 'bg-green-900/30 text-green-400 border border-green-800'
                : 'bg-slate-800 text-purple-300 border border-slate-700'
            } px-1.5 py-0.5 rounded-sm text-sm font-mono`} {...props}>
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
    