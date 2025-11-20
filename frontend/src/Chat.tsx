import React, { useState, useRef, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatMessage {
    role: 'user' | 'assistant' | 'error';
    content: string;
}

interface ChatResponse {
    message: string;
    input?: string;
    tenant?: string;
}

const Chat: React.FC = () => {
    const [message, setMessage] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [tenantId, setTenantId] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');
    const [mode, setMode] = useState<'user' | 'tenant'>('user');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [chatHistory]);

    const sendMessage = async () => {
        if (!message) return;

        setLoading(true);
        const currentMessage = message;
        setChatHistory(prev => [...prev, { role: 'user', content: currentMessage }]);
        setMessage('');

        try {
            let headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            let endpoint = '/api/chat';

            if (mode === 'user') {
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } else {
                endpoint = '/tenant/chat';
                headers['X-Tenant-Id'] = tenantId;
                headers['X-Api-Key'] = apiKey;
            }

            // Use environment variable for API URL or default to localhost
            const apiUrl = import.meta.env.VITE_API_ENDPOINT || 'http://127.0.0.1:8000';

            const response = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message: currentMessage }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data: ChatResponse = await response.json();
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setChatHistory(prev => [...prev, { role: 'error', content: 'Failed to send message' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Card className="w-full h-[80vh] flex flex-col">
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle>Bedrock Chat</CardTitle>
                        <div className="flex gap-4 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="user"
                                    checked={mode === 'user'}
                                    onChange={() => setMode('user')}
                                    className="accent-primary"
                                />
                                Web User
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="tenant"
                                    checked={mode === 'tenant'}
                                    onChange={() => setMode('tenant')}
                                    className="accent-primary"
                                />
                                Tenant
                            </label>
                        </div>
                    </div>

                    {mode === 'tenant' && (
                        <div className="flex gap-2 mt-2 pt-2 border-t">
                            <Input
                                placeholder="Tenant ID"
                                value={tenantId}
                                onChange={(e) => setTenantId(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <Input
                                placeholder="API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {chatHistory.length === 0 && (
                                <div className="text-center text-muted-foreground py-10">
                                    Start a conversation...
                                </div>
                            )}
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-lg shadow-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : msg.role === 'error'
                                                ? 'bg-destructive text-destructive-foreground'
                                                : 'bg-muted text-foreground'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm animate-pulse">
                                        Thinking...
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t bg-background">
                        <div className="flex gap-2">
                            <Input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Type a message..."
                                className="flex-1"
                                disabled={loading}
                            />
                            <Button onClick={sendMessage} disabled={loading}>
                                Send
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Chat;
