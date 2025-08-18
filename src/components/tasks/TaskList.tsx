import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, LogOut } from "lucide-react";
import { TaskForm } from "./TaskForm";
import type { Task } from "@/types/task";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće učitati zadatke",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(tasks.filter(task => task.id !== id));
      toast({
        title: "Uspešno!",
        description: "Zadatak je obrisan",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće obrisati zadatak",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, status: newStatus } : task
      ));
      
      toast({
        title: "Uspešno!",
        description: "Status zadatka je ažuriran",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće ažurirati status",
      });
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'Završeno';
      case 'in_progress': return 'U toku';
      default: return 'Na čekanju';
    }
  };

  const getPriorityText = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'Visok';
      case 'medium': return 'Srednji';
      default: return 'Nizak';
    }
  };

  if (showForm || editingTask) {
    return (
      <TaskForm
        task={editingTask}
        onSave={(task) => {
          if (editingTask) {
            setTasks(tasks.map(t => t.id === task.id ? task : t));
          } else {
            setTasks([task, ...tasks]);
          }
          setShowForm(false);
          setEditingTask(null);
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Učitava...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Moji zadaci</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(true)}>
              Dodaj zadatak
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Odjavi se
            </Button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nema zadataka</CardTitle>
              <CardDescription>
                Dodajte prvi zadatak da biste počeli
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{task.title}</CardTitle>
                      {task.description && (
                        <CardDescription className="mt-2">
                          {task.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTask(task)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityText(task.priority)}
                    </Badge>
                    {task.due_date && (
                      <Badge variant="outline">
                        Rok: {new Date(task.due_date).toLocaleDateString('sr-RS')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {task.status !== 'completed' && (
                      <>
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                          >
                            Počni
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                        >
                          Završi
                        </Button>
                      </>
                    )}
                    {task.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(task.id, 'pending')}
                      >
                        Vrati na čekanje
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}