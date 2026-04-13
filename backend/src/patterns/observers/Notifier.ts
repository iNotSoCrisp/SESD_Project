export interface Notifier {
  notify(message: string): void | Promise<void>;
}

export class ConsoleNotifier implements Notifier {
  notify(message: string): void {
    console.log(message);
  }
}