import React, { useEffect, useState } from "react";
import { updateMessages } from "../../utils/chat/updateMessages";
import { ThreadMessage } from "openai/resources/beta/threads/messages/messages";
import { Thread } from "openai/resources/beta/threads/threads";
import { Run } from "openai/resources/beta/threads/runs/runs";
import { Assistant } from "openai/resources/beta/assistants/assistants";

const useAssistant = () => {
  const [allAssistants, setAllAssistants] = useState<Assistant[] | null>(null);
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [assistantIsLoading, setAssistantIsLoading] = useState(false);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    getAssistants();
  }, []);

  // get all assistants
  const getAssistants = async () => {
    const response = await fetch("/api/assistant/getAllAssistants", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res: any = await response.json();
    console.log(`all assistants:`, res.data);
    setAllAssistants([...res.data]);
    setAssistant(res.data[0]);
  };

  // get assistant response provide prompt and optional message history
  const getAssistantResponse = async (
    prompt: string,
    messageHistory?: ThreadMessage[]
  ) => {
    setAssistantIsLoading(true);
    const question = prompt;

    console.log("history", messageHistory);
    if (messageHistory) {
      setMessages(messageHistory);
    }

    // get run (if no thread exists, create one)
    const response = await fetch("/api/assistant/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: question,
        assistantId: assistant?.id,
        threadId: thread?.id,
      }),
    });

    const runResponse = await response.json();
    setRun(runResponse);

    console.log("current context run: ", runResponse);

    //get thread
    const threadResponse = await fetch(
      `/api/thread/getThread/${runResponse.thread_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const threadRes = await threadResponse.json();
    console.log(`thread response:`, threadRes);
    setThread(threadRes);

    // calls run until it is completed
    if (threadRes) {
      //start init run
      await startRun(threadRes, runResponse);

      //get all runs of thread
      var irunListResponse = await fetch("/api/run/getAllRuns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: threadRes.id,
        }),
      });
      var runList = await irunListResponse.json();
      console.log("run list ", runList);

      //repeat start run until run is completed
      while (runList.data[0].status !== "completed") {
        //check if run failed
        if (runList.data[0].status === "failed") {
          console.log("run failed");
          console.log("cancel run");
          const cancelRunResponse = await fetch("/api/run/cancelRun", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              threadId: threadRes.id,
              runId: runList.data[0].id,
            }),
          });
          const cancelRunData = await cancelRunResponse.json();
          console.log("cancel run data", cancelRunData);
          break;
        }
        await new Promise<void>((done) => setTimeout(() => done(), 1000));
        irunListResponse = await fetch("/api/run/getAllRuns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId: threadRes.id,
          }),
        });

        runList = await irunListResponse.json();
        console.log("run list after running", runList);

        //check if action is required
        if (runList.data[0].status === "requires_action") {
          await startRun(threadRes, runResponse);
        }
      }

      await new Promise<void>((done) => setTimeout(() => done(), 1000));

      //deactivate loading animation
      setAssistantIsLoading(false);

      //updating messages (optional set function, returns messages history)
      return await updateMessages(
        threadRes,
        messageHistory || messages,
        setMessages
      );
    }
  };

  const setAssistantById = (id: string) => {
    const found = allAssistants?.find((assistant) => assistant.id === id);
    if (found) {
      console.log("found assistant", found);
      setAssistant(found);
    }
  };

  return {
    allAssistants,
    activeAssistant: assistant,
    setAssistantById,
    getAssistantResponse,
    thread,
    run,
    assistantIsLoading,
  };
};

const startRun = async (thread: any, run: any) => {
  await new Promise<void>((done) => setTimeout(() => done(), 1000));
  console.log("debug thread", thread);
  console.log("debug run", run);

  //get all runs of thread
  var initRunListResponse = await fetch("/api/run/getAllRuns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId: thread.id,
    }),
  });

  var initRunList = await initRunListResponse.json();

  console.log("init run list", initRunList);

  //get all run steps of run
  var initResponse = await fetch("/api/run/getRunStepList", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      runId: run.id,
      threadId: thread.id,
    }),
  });
  const initRes = await initResponse.json();
  const initRunSteps = initRes.data;

  var response = initResponse;
  var res = initRes;
  var runSteps = initRunSteps;

  console.log("init run steps", initRes);

  while (
    runSteps?.length &&
    (runSteps[0].status === "in_progress" || runSteps[0].status === "queued")
  ) {
    //check for tool call
    if (runSteps[0].step_details.type === "tool_calls") {
      console.log("tool call");

      //check if step_details/tool_calls is empty
      //test function
      if (!runSteps[0].step_details.tool_calls.length) {
        await new Promise<void>((done) => setTimeout(() => done(), 1000));
        response = await fetch("/api/run/getRunStepList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            runId: run.id,
            threadId: thread.id,
          }),
        });
        res = await response.json();

        console.log("new rundata", res.data);
        runSteps = res.data;
        continue;
      }

      const toolCalls = runSteps[0].step_details.tool_calls;

      var toolCallResponse = await fetch("/api/tool/toolCall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolCalls,
          threadId: thread.id,
          runId: runSteps[0].run_id,
        }),
      });
      const toolCallRes = await toolCallResponse.json();
      console.log("tool call response", toolCallRes);
    }

    console.log("run status is in progress or queued");
    console.log("run", res);
    await new Promise<void>((done) => setTimeout(() => done(), 1000));
    response = await fetch("/api/run/getRunStepList", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runId: run.id,
        threadId: thread.id,
      }),
    });
    res = await response.json();

    // get message ids
    var runSteps = res.data;
  }

  console.log("run status is completed");
  console.log("steps", res);

  // check if more than one run step
  if (runSteps.length > 1) {
    runSteps.shift();
  }
  return;
};

export default useAssistant;
