import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import AddFolderButton from "./AddFolderButton";
import AddFileButton from "./AddFileButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export default function NavbarComponent() {
  return (
    <Navbar bg="light" expand="lg">
      <Navbar.Brand as={Link} to="/">MyDrive</Navbar.Brand>
      <Nav className="mr-auto">
      </Nav>
    </Navbar>
  );
}
