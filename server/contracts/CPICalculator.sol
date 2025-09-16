// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "hardhat/console.sol";

contract CPICalculator {
    uint256 public totalStudents;
    uint256 public totalTeachers;

    struct Teacher {
        string name;
        string subject;
    }

    struct Student {
        string name;
        uint256[] marks;
    }

    Teacher[] public teachers;
    Student[] public students;

    function addTeacher(string memory _name, string memory _subject) public {
        teachers.push(Teacher(_name, _subject));
        totalTeachers = teachers.length;
        console.log("adding teacher");
        for (uint256 i = 0; i < students.length; i++) {
            students[i].marks.push(0);
        }
    }

    function addStudent(string memory _name) public {
        uint256[] memory emptyMarks = new uint256[](teachers.length);
        console.log("adding student");
        students.push(Student(_name, emptyMarks));
        totalStudents = students.length;
    }

    function addMarks(
        uint256 studentIndex,
        uint256 teacherIndex,
        uint256 mark
    ) public {
        require(studentIndex < students.length, "Invalid student index");
        require(teacherIndex < teachers.length, "Invalid teacher index");
        students[studentIndex].marks[teacherIndex] = mark;
        console.log("adding marks");
    }

    function calculateCPI(uint256 studentIndex) public view returns (uint256) {

        require(studentIndex < students.length, "Invalid student index");
        uint256 sum = 0;
        uint256 count = students[studentIndex].marks.length;
        for (uint256 i = 0; i < count; i++) {
            sum += students[studentIndex].marks[i];
        }
        console.log("count", count);
        console.log("sum", sum);
        if (count == 0) return 0;
        uint256 result = (sum * 1e18) / (count * 10);
        return result;
    }
}
