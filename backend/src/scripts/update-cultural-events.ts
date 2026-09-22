import { prisma } from "../lib/prisma";
import { RegistrationType, EventStatus } from "../../generated/prisma/client";

async function main() {
  console.log("Synchronizing Cultural Events in database...");

  // 1. Update Magic Show
  await prisma.event.upsert({
    where: { id: "cultural-11" },
    update: {
      posterUrl: "/assets/Magic show.jpeg",
      registrationOpen: true,
    },
    create: {
      id: "cultural-11",
      slug: "cultural-11",
      name: "Magic Show — By Sagar Kumar",
      description: "An enchanting live magic performance by Sagar Kumar celebrating illusion, wonder, and mystery.",
      posterUrl: "/assets/Magic show.jpeg",
      categoryId: "cultural",
      fee: 49,
      registrationType: RegistrationType.INDIVIDUAL,
      minTeamSize: 1,
      maxTeamSize: 1,
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      date: "30 October 2026",
      day: "Friday",
      time: "10:30 AM - 12:00 PM",
      venue: "Kalpvriksha Auditorium",
      prizes: "NA",
      rules: "Open to all students and attendees with valid registration.",
      facultyCoordinator: "Dr. Nitika Vats Doohan, Prof Nidhi Sharma (IMS)",
      studentCoordinator: "Mr. Tejas Apte - 993052379, Mr. Divyasnh Soni - 6262252359",
    },
  });
  console.log("✓ Magic Show poster updated and registration opened");

  // 2. Update Standup Comedy
  await prisma.event.upsert({
    where: { id: "cultural-12" },
    update: {
      posterUrl: "/assets/Standup Comedy.jpeg",
      registrationOpen: true,
    },
    create: {
      id: "cultural-12",
      slug: "cultural-12",
      name: "Standup Comedy — By Pankaj Upadhyay",
      description: "A high-energy live standup comedy performance by Pankaj Upadhyay bringing humor and joy to Euphoria.",
      posterUrl: "/assets/Standup Comedy.jpeg",
      categoryId: "cultural",
      fee: 199,
      registrationType: RegistrationType.INDIVIDUAL,
      minTeamSize: 1,
      maxTeamSize: 1,
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      date: "28 October 2026",
      day: "Wednesday",
      time: "02:00 PM - 3:00 PM",
      venue: "Kalpvriksha Auditorium",
      prizes: "NA",
      rules: "Open to all students and attendees with valid registration.",
      facultyCoordinator: "Dr. Nitika Vats Doohan, Prof Nidhi Sharma (IMS)",
      studentCoordinator: "Mr. Tejas Apte - 993052379, Mr. Divyasnh Soni - 6262252359",
    },
  });
  console.log("✓ Standup Comedy poster updated and registration opened");

  // 3. Add Move & Groove — Solo Dance Audition
  await prisma.event.upsert({
    where: { id: "cultural-13" },
    update: {
      name: "Move & Groove — Solo Dance Audition",
      description: "Solo dance audition for performers seeking to qualify for the Move & Groove showcase.",
      posterUrl: "/assets/Move & Groove Solo Audition.jpg",
      fee: 99,
      capacity: 50,
      date: "16-10-2026",
      day: "Friday",
      time: "10:00 AM to 4:00 PM",
      venue: "Kalpvriksha Auditorium",
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Surbhi Sudame - 9713742310",
      studentCoordinator: "Ms. Yogeshwari Agrawal - 8085184206, Ms. Himashi Bhola - 9630843077",
      eventFamily: "Move & Groove — Solo",
      stage: "audition",
    },
    create: {
      id: "cultural-13",
      slug: "cultural-13",
      name: "Move & Groove — Solo Dance Audition",
      description: "Solo dance audition for performers seeking to qualify for the Move & Groove showcase.",
      posterUrl: "/assets/Move & Groove Solo Audition.jpg",
      categoryId: "cultural",
      fee: 99,
      capacity: 50,
      registrationType: RegistrationType.INDIVIDUAL,
      minTeamSize: 1,
      maxTeamSize: 1,
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      date: "16-10-2026",
      day: "Friday",
      time: "10:00 AM to 4:00 PM",
      venue: "Kalpvriksha Auditorium",
      prizes: "Advancement to Competition Round",
      rules: "Solo performers only. Prepare an audition piece up to 3 minutes.",
      facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Surbhi Sudame - 9713742310",
      studentCoordinator: "Ms. Yogeshwari Agrawal - 8085184206, Ms. Himashi Bhola - 9630843077",
      eventFamily: "Move & Groove — Solo",
      stage: "audition",
    },
  });
  console.log("✓ Move & Groove — Solo Dance Audition added");

  // 4. Add Move & Groove — Group Dance Audition
  await prisma.event.upsert({
    where: { id: "cultural-14" },
    update: {
      name: "Move & Groove — Group Dance Audition",
      description: "Group dance audition for dance crews seeking to qualify for the Move & Groove showcase.",
      posterUrl: "/assets/Move n groove audition.jpg",
      fee: 199,
      capacity: 30,
      date: "16-10-2026",
      day: "Friday",
      time: "10:00 AM to 4:00 PM",
      venue: "Kalpvriksha Auditorium",
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Surbhi Sudame - 9713742310",
      studentCoordinator: "Ms. Yogeshwari Agrawal - 8085184206, Ms. Himashi Bhola - 9630843077",
      eventFamily: "Move & Groove — Group",
      stage: "audition",
    },
    create: {
      id: "cultural-14",
      slug: "cultural-14",
      name: "Move & Groove — Group Dance Audition",
      description: "Group dance audition for dance crews seeking to qualify for the Move & Groove showcase.",
      posterUrl: "/assets/Move n groove audition.jpg",
      categoryId: "cultural",
      fee: 199,
      capacity: 30,
      registrationType: RegistrationType.GROUP,
      minTeamSize: 5,
      maxTeamSize: 15,
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      date: "16-10-2026",
      day: "Friday",
      time: "10:00 AM to 4:00 PM",
      venue: "Kalpvriksha Auditorium",
      prizes: "Advancement to Competition Round",
      rules: "Dance crews of 5 to 15 members. Prepare an audition routine.",
      facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Surbhi Sudame - 9713742310",
      studentCoordinator: "Ms. Yogeshwari Agrawal - 8085184206, Ms. Himashi Bhola - 9630843077",
      eventFamily: "Move & Groove — Group",
      stage: "audition",
    },
  });
  console.log("✓ Move & Groove — Group Dance Audition added");

  // 5. Add Swara Fiesta — Singing Audition
  await prisma.event.upsert({
    where: { id: "cultural-15" },
    update: {
      name: "Swara Fiesta — Singing Audition",
      description: "Solo vocal audition for singers seeking to qualify for the Swara Fiesta stage.",
      posterUrl: "/assets/Swar Fiesta Audition.jpg",
      fee: 99,
      capacity: 50,
      date: "15-10-2026",
      day: "Thursday",
      time: "10:00 AM to 4:00 PM",
      venue: "Kalpvriksha Auditorium",
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Rishikesh Parnekar - 77468 81737",
      studentCoordinator: "Shivani Kumari - 8236032783",
      eventFamily: "Swara Fiesta",
      stage: "audition",
    },
    create: {
      id: "cultural-15",
      slug: "cultural-15",
      name: "Swara Fiesta — Singing Audition",
      description: "Solo vocal audition for singers seeking to qualify for the Swara Fiesta stage.",
      posterUrl: "/assets/Swar Fiesta Audition.jpg",
      categoryId: "cultural",
      fee: 99,
      capacity: 50,
      registrationType: RegistrationType.INDIVIDUAL,
      minTeamSize: 1,
      maxTeamSize: 1,
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      date: "15-10-2026",
      day: "Thursday",
      time: "10:00 AM to 4:00 PM",
      venue: "Kalpvriksha Auditorium",
      prizes: "Advancement to Competition Round",
      rules: "Solo singing performance. Carry backing track on USB drive if required.",
      facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Rishikesh Parnekar - 77468 81737",
      studentCoordinator: "Shivani Kumari - 8236032783",
      eventFamily: "Swara Fiesta",
      stage: "audition",
    },
  });
  console.log("✓ Swara Fiesta — Singing Audition added");

  // 6. Link main competitions to their event families
  await prisma.event.updateMany({
    where: { id: "cultural-1" },
    data: { eventFamily: "Move & Groove — Solo", stage: "main" },
  });
  await prisma.event.updateMany({
    where: { id: "cultural-2" },
    data: { eventFamily: "Move & Groove — Group", stage: "main" },
  });
  await prisma.event.updateMany({
    where: { id: "cultural-3" },
    data: { eventFamily: "Swara Fiesta", stage: "main" },
  });
  console.log("✓ Main competitions linked to event families");

  console.log("\nDatabase Cultural events update complete!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed to update cultural events:", err);
  process.exit(1);
});
