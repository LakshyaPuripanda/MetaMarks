const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CPICalculator", function () {
  it("should add teachers and students correctly", async function () {
    const CPICalculator = await ethers.getContractFactory("CPICalculator");
    const cpi = await CPICalculator.deploy();
    await cpi.waitForDeployment();

    await cpi.addTeacher("Alice", "Math");
    await cpi.addStudent("Bob");

    await cpi.addMarks(0, 0, 80); 
    const result = await cpi.calculateCPI(0);

    expect(result).to.equal(1000);
  });
});
