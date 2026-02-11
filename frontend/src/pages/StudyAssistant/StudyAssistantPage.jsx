import React from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import { Brain, MessageCircle, Target, Zap, FileText, PenTool } from "lucide-react";
import { useNavigate } from "react-router-dom"
export default function StudyAssistantPage() {
    const navigate = useNavigate()
    const studyTools = [
        {
            icon: MessageCircle,
            title: "Chat Assistant",
            description: "Get instant help with your questions",
            path: "/study-assistant/chat",
            color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
            iconColor: "text-blue-600",
        },
        {
            icon: Target,
            title: "Quiz Generator",
            description: "Create custom quizzes from your materials",
            path: "/study-assistant/quiz",
            color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
            iconColor: "text-purple-600",
        },
        // {
        //     icon: Zap,
        //     title: "Flashcards",
        //     description: "Interactive flashcards for quick learning",
        //     path: "/study-assistant/flashcards",
        //     color: "bg-orange-50 hover:bg-orange-100 border-orange-200",
        //     iconColor: "text-orange-600",
        // },
        {
            icon: FileText,
            title: "Summarizer",
            description: "Summarize documents and articles",
            path: "/study-assistant/summarize",
            color: "bg-green-50 hover:bg-green-100 border-green-200",
            iconColor: "text-green-600",
        },
        {
            icon: PenTool,
            title: "Document Generator",
            description: "Generate your Submission Documents",
            path: "/study-assistant/docgenerator",
            color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
            iconColor: "text-indigo-600",
        },
    ];

    

    

    


  
    

    return (
        <div className="min-h-screen bg-white flex">
            <SidebarNavigation />

            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
                            <Brain className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">Study Assistant</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Enhance your learning with AI-powered tools designed to help you study more effectively
                        </p>
                    </div>

                    {/* Study Tools Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
                        {studyTools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <div
                                    key={tool.title}
                                    className={`rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${tool.color}`}
                                    onClick={() => navigate(tool.path)}
                                >
                                    <div className="p-8 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-6">
                                            <Icon className={`h-8 w -8 ${tool.iconColor}`} />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{tool.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{tool.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}