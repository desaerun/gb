import {Client, Message} from "discord.js";

export default interface Command {
    readonly name: string;
    readonly description: string;
    readonly args?: Array<{ param: string, type: string, description: string, default?: string }>;
    executeCommand(client: Client, message: Message, args: Array<String>): void;
}