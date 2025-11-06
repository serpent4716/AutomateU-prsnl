"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarNavigation } from "./SidebarNavigation" // adjusted import
import { Send, Search, MoreVertical, MessageCircle, Users, Phone, Video } from "lucide-react"

const staticUsers = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    lastSeen: "now",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    lastSeen: "5 minutes ago",
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "offline",
    lastSeen: "2 hours ago",
  },
]

const staticMessages = {
  "1": [
    {
      id: "1",
      senderId: "1",
      content: "Hey! How's the new task management feature coming along?",
      timestamp: "2024-01-15T10:30:00Z",
      type: "text",
    },
    {
      id: "2",
      senderId: "current-user",
      content: "Going great! Just finished the drag and drop functionality. Want to test it out?",
      timestamp: "2024-01-15T10:32:00Z",
      type: "text",
    },
  ],
}

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState("1")
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [messages, setMessages] = useState(staticMessages)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedUser])

  const handleSendMessage = () => {
    if (!message.trim() || !selectedUser) return

    const newMessage = {
      id: Date.now().toString(),
      senderId: "current-user",
      content: message.trim(),
      timestamp: new Date().toISOString(),
      type: "text",
    }

    setMessages((prev) => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), newMessage],
    }))

    setMessage("")
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredUsers = staticUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedUserData = staticUsers.find((user) => user.id === selectedUser)
  const currentMessages = selectedUser ? messages[selectedUser] || [] : []

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarNavigation />

      <main className="flex-1 flex h-screen">
        {/* Users List */}
        <div className="w-80 border-r border-gray-300 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Team Chat</h1>
                <p className="text-sm text-gray-500">{staticUsers.length} members</p>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`cursor-pointer transition-all duration-200 p-3 rounded-lg hover:bg-gray-100 ${
                    selectedUser === user.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      {user.status === "online" && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.lastSeen}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedUserData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-300 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedUserData.avatar}
                    alt={selectedUserData.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedUserData.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedUserData.status === "online"
                        ? "Active now"
                        : `Last seen ${selectedUserData.lastSeen}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 border rounded-lg hover:bg-gray-100">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-2 border rounded-lg hover:bg-gray-100">
                    <Video className="h-4 w-4" />
                  </button>
                  <button className="p-2 border rounded-lg hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === "current-user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.senderId === "current-user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.senderId === "current-user" ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-300 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose someone from your team to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
