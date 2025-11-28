import { ROLE } from "../generated/prisma/enums";

// Type definitions for CSV rows
export interface UserCSVRow {
    First_Name: string;
    Middle_Name: string;
    Last_Name: string;
    Email: string;
    Phone: string;
    Campus: string;
    Role: keyof typeof ROLE;
    Event_Category: string;
    Associated_Teams: string;
}

export interface EventCSVRow {
    Name: string;
    Description: string;
    Slug: string;
    Thumb_URL: string;
    Max_Registrations: string;
    Domain_Lead_Email: string;
    Date: string;
}
