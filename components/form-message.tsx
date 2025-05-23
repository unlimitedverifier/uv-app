import { use } from 'react';
import { cn } from '@/utils/styles';

export type Message =
  | { success: string }
  | { error: string }
  | { message: string }
  | null
  | undefined;

export function FormMessage({ message }: { message: Message | Promise<Message> }) {
  // If message is a Promise (like searchParams), resolve it using React.use()
  const resolvedMessage = message && message instanceof Promise ? use(message) : message;
  
  // If no message or undefined/null, don't render anything
  if (!resolvedMessage) return null;
  
  // Determine the message text and style based on the type
  let messageText = '';
  let className = 'text-sm border-l-2 px-4 w-full max-w-md';
  
  if ('success' in resolvedMessage) {
    messageText = resolvedMessage.success;
    className = cn(className, 'text-foreground border-foreground');
  } else if ('error' in resolvedMessage) {
    messageText = resolvedMessage.error;
    className = cn(className, 'text-destructive-foreground border-destructive-foreground');
  } else if ('message' in resolvedMessage) {
    messageText = resolvedMessage.message;
    className = cn(className, 'text-foreground');
  } else {
    return null;
  }
  
  return <p className={className}>{messageText}</p>;
}
