const fs = require("fs");
const path = require("path");


export const installMotokoBakend = async (projectName: String, projectPath: String, dfxJson: any) => {
    fs.writeFileSync(
        path.join(projectPath, "dfx.json"),
        JSON.stringify(dfxJson, null, 2)
    );

    const MotokoPath = path.join(projectPath, `src/${projectName}_backend`);
    const MotokoDeclarations = path.join(projectPath, `src/declarations`);
    fs.mkdirSync(MotokoPath, { recursive: true });
    fs.mkdirSync(MotokoDeclarations, { recursive: true });

    const MotokoMain = `
actor {
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
};
 `;

    const MotokoDidFile = `
service : {
  greet: (text) -> (text) query;
}
`;
    try {
        fs.writeFileSync(path.join(MotokoDeclarations, `${projectName}_backend.did`), MotokoDidFile.trim());
        fs.writeFileSync(path.join(MotokoPath, "main.mo"), MotokoMain.trim());
    } catch (error) {
        console.log(error);
    }
}