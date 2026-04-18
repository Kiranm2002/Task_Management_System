import { useEffect, useState } from "react";
import axios from "../api/axios";
import { socket } from "../api/socket";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const res = await axios.get("/tasks");
    setTasks(res.data.data);
  };

  useEffect(() => {
    fetchTasks();

    const socket = initSocket();

    socket.on("taskCreated", fetchTasks);
    socket.on("taskUpdated", fetchTasks);
    socket.on("taskDeleted", fetchTasks);

    return () => socket.disconnect();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-semibold mb-4">Tasks</h1>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="bg-white p-4 rounded-xl shadow flex justify-between"
          >
            <div>
              <h2 className="font-medium text-gray-800">
                {task.title}
              </h2>
              <p className="text-sm text-gray-500">
                {task.description}
              </p>
            </div>

            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}