"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, Edit2Icon, Trash2Icon } from "lucide-react";
import TaskForm from "./TaskForm";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface Agent {
  id: number;
  name: string;
}

interface Task {
  id: number;
  description: string;
  expected_output: string;
  agent_id: number;
  profile_id: string;
}

interface TaskManagementProps {
  crewId: number;
  onTaskAdded: () => void;
  tasks: Task[];
  agents: Agent[];
  currentUser: string | null;
  onEditTask: (task: Task) => void;
}

export default function TaskManagement({
  crewId,
  onTaskAdded,
  tasks,
  agents,
  currentUser,
  onEditTask,
}: TaskManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleTaskSubmitted = () => {
    toast({
      title: "Success",
      description: editingTask
        ? "Task updated successfully"
        : "Task created successfully",
    });
    onTaskAdded();
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
    onEditTask(task);
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      onTaskAdded(); // Refresh the task list
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAgentName = (agentId: number) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : "Unassigned";
  };

  const filteredTasks = tasks.filter((task) =>
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight mt-2">Tasks</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Edit Task" : "Create New Task"}
              </DialogTitle>
            </DialogHeader>
            <TaskForm
              crewId={crewId}
              agents={agents}
              task={editingTask || undefined}
              onTaskSubmitted={handleTaskSubmitted}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingTask(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Input
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm mb-4"
      />
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Expected Output</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="link">
                        {task.description.substring(0, 30)}...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <p>{task.description}</p>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="link">
                        {task.expected_output.substring(0, 30)}...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <p>{task.expected_output}</p>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>{getAgentName(task.agent_id)}</TableCell>
                <TableCell>
                  {currentUser === task.profile_id && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit2Icon className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2Icon className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
