import { useLazyQuery } from "@apollo/client";
import { Badge, Button, Input, List } from "antd";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { GET_CHAT, useChats } from "../hooks/useChats";
import { socket } from "../socket";
import UserAvatar from "./UserAvatar";

const { TextArea } = Input;

//#region Styles

const Layout = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
`;

const Sider = styled.aside`
  background: var(--color-grey-50);
  border-radius: var(--border-radius-md);
  overflow-y: auto;
`;

const UserList = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 1rem;
  gap: 1rem;
`;

const User = styled.li`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  color: var(--color-grey-600);
  font-size: 1.6rem;
  font-weight: 500;
  padding: 1.2rem 2.4rem;
  transition: all 0.3s;
  cursor: pointer;

  &:hover,
  &.active {
    color: var(--color-grey-800);
    background-color: var(--color-brand-50);
    border-radius: var(--border-radius-sm);
  }
`;

const MessageContainer = styled.div`
  padding: 1.2rem;
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  height: 50vh;
`;

const MessageList = styled(List)`
  flex-grow: 1;
  overflow-y: auto;
`;

const InputContainer = styled.div`
  display: flex;
  margin-top: 20px;
  gap: 10px;
`;

//#endregion Styles

function DMs() {
  const { chats, setChats, loading, error, updateLastSeen, sendNewMessage } =
    useChats();
  const [inputValue, setInputValue] = useState("");
  const [chat, setChat] = useState(null);
  const [getChat, { loading: chatLoading, error: chatError }] =
    useLazyQuery(GET_CHAT);

  useEffect(() => {
    const onNewMessage = (newMsg) => {
      const { messages, ...rest } = chat;
      const newMessages = [...messages, newMsg];
      setChat({ ...rest, messages: newMessages });
    };

    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("newMessage", onNewMessage);
    };
  }, [chat]);

  const handleUserClick = async (clickedChat) => {
    const clone = structuredClone(chats);
    const chat = clone.find((x) => x.recipient.id === clickedChat.recipient.id);
    chat.unread = 0;
    setChats(clone);

    updateLastSeen({ variables: { recipientId: clickedChat.recipient.id } });
    const result = await getChat({
      variables: { recipientId: clickedChat.recipient.id }
    });
    setChat(result.data.chat);
  };

  const handleSendMsg = () => {
    if (!chat) return;
    if (inputValue.trim() === "") return;
    try {
      sendNewMessage({
        variables: { recipientId: chat.recipient.id, content: inputValue }
      });
      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!chats || chats.length === 0) return <p>No chats found</p>;

  return (
    <Layout>
      <Sider>
        <UserList>
          {chats.map((x) => (
            <User
              key={x.recipient.id}
              className={chat?.recipient.id === x.recipient.id ? "active" : ""}
              onClick={() => handleUserClick(x)}
            >
              <UserAvatar size="small" name={x.recipient.name} gap={6} />
              {x.unread > 0 ? (
                <Badge count={x.unread} offset={[10, 0]}>
                  <span>{x.recipient.name}</span>
                </Badge>
              ) : (
                <span>{x.recipient.name}</span>
              )}
            </User>
          ))}
        </UserList>
      </Sider>
      <MessageContainer>
        {chat && (
          <MessageList
            itemLayout="horizontal"
            dataSource={chat.messages}
            renderItem={(message) => (
              <List.Item key={message.createdAt}>
                <List.Item.Meta
                  title={
                    message.recipientId === chat.recipient.id
                      ? chat.sender.name
                      : chat.recipient.name
                  }
                  description={message.content}
                />
              </List.Item>
            )}
          />
        )}
        {chat && (
          <InputContainer>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMsg()
              }
              placeholder="Type a message..."
              autoSize
            />
            <Button type="primary" onClick={handleSendMsg}>
              Send
            </Button>
          </InputContainer>
        )}
      </MessageContainer>
    </Layout>
  );
}

export default DMs;
