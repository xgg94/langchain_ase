const updateMessages = async (thread, messageHistory, setMessages) => {
  // get all messages
  const messagesResponse = await fetch(`/api/message/getAllThreadMessages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId: thread.id,
    }),
  });
  const messages = await messagesResponse.json();
  console.log("all thread messages", messages);
  var sortedMessages = messages.data
    .slice(0)
    .reverse()
    .map((msg) => {
      let msgObj = {
        content: msg.content[0].text.value,
        role: msg.role === "user" ? "user" : "ai",
        threadId: msg.thread_id,
        id: msg.id,
      };
      return msgObj;
    });

  console.log("old messages", messageHistory);
  console.log("new messages", sortedMessages);

  //add new messages to message history if not already in there
  sortedMessages.forEach((msg) => {
    const found = messageHistory.find((m) => m?.id === msg?.id);
    if (!found) {
      messageHistory.push(msg);
    }
  });

  if (setMessages) setMessages(messageHistory);
  return messageHistory;
};

//export multiple modules
export { updateMessages };
