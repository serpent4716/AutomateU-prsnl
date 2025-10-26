import React, { useState, useMemo } from 'react';
import { ChevronDown, FileText, CheckCircle, Loader, AlertTriangle, ListChecks } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Document Status Icon (from your chat page)
const DocumentStatusIcon = ({ status }) => {
  switch (status) {
    case 'COMPLETE': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'PROCESSING': return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'FAILED': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default: return <FileText className="h-4 w-4 text-gray-400" />;
  }
};

export function QuizSidebar({ 
  documents, 
  quizHistory, 
  onSelectDocument, 
  onSelectQuizHistory 
}) {
  const [expandedTags, setExpandedTags] = useState({});
  const [isDocsExpanded, setIsDocsExpanded] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  // Group documents by tag (re-used from your chat page)
  const groupedDocuments = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const tag = doc.tag || 'Uncategorized';
      if (!acc[tag]) {
        acc[tag] = [];
      }
      acc[tag].push(doc);
      return acc;
    }, {});
  }, [documents]);

  const toggleTagExpansion = (tag) => {
    setExpandedTags(prev => ({ ...prev, [tag]: !prev[tag] }));
  };

  return (
    <div className="w-80 border-r bg-white flex flex-col shrink-0 h-screen">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Quiz Generator</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        
        {/* Quiz History Section */}
        <div>
          <button 
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="w-full flex justify-between items-center px-2 py-2 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span>Quiz History</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isHistoryExpanded ? "rotate-180" : "")} />
          </button>
          {isHistoryExpanded && (
            <div className="pl-2 mt-1 space-y-1">
              {quizHistory.length === 0 && <p className="text-xs text-gray-400 px-2 py-1">No quizzes taken yet.</p>}
              {quizHistory.map(quiz => (
                <button 
                  key={quiz.id}
                  onClick={() => onSelectQuizHistory(quiz.id)}
                  className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-sm group"
                >
                  <span className="truncate text-gray-600">
                    Quiz from {quiz.source_document_filename || "pasted text"}
                  </span>
                  {quiz.score && <span className="ml-auto text-xs font-medium text-blue-600">{quiz.score}%</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="mt-2">
          <button 
            onClick={() => setIsDocsExpanded(!isDocsExpanded)}
            className="w-full flex justify-between items-center px-2 py-2 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>My Documents</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isDocsExpanded ? "rotate-180" : "")} />
          </button>
          {isDocsExpanded && (
            <div className="pl-2 mt-1 space-y-1">
              {Object.entries(groupedDocuments).map(([tag, docsInGroup]) => (
                <div key={tag}>
                  <button onClick={() => toggleTagExpansion(tag)} className="w-full flex justify-between items-center px-2 py-1 text-sm font-semibold text-gray-500 rounded-md hover:bg-gray-100">
                    <span>{tag}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", expandedTags[tag] ? "rotate-180" : "")} />
                  </button>
                  {expandedTags[tag] && (
                    <div className="pl-2 mt-1 space-y-1">
                      {docsInGroup.map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => onSelectDocument(doc)}
                          disabled={doc.status !== 'COMPLETE'}
                          className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <DocumentStatusIcon status={doc.status} />
                          <span className="truncate text-gray-600" title={doc.filename}>{doc.filename}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
