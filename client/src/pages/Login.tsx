import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { login, isAuthed } from "@/lib/auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed()) setLocation("/");
  }, [setLocation]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username.trim(), password)) {
      setError(null);
      setLocation("/");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center px-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-heading font-semibold mb-2 text-center">Enter Site</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">Private preview of the First Teaching guide</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Username</label>
            <input
              className="w-full rounded-full border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              className="w-full rounded-full border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button type="submit" className="w-full rounded-full shadow-sm hover:shadow-md">Enter</Button>
        </form>

        
      </Card>
    </div>
  );
}
