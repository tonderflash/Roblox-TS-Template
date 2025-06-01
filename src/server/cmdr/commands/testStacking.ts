export = {
    Name: "testStacking",
    Aliases: ["teststack", "ts"],
    Description: "Prueba el sistema de stacking dando recursos que excedan el límite",
    Group: "Admin",
    Args: [
        {
            Type: "string",
            Name: "resourceType",
            Description: "Tipo de recurso (wood, rope, cloth, iron, etc.)"
        },
        {
            Type: "number",
            Name: "amount",
            Description: "Cantidad a dar (opcional, por defecto 150)",
            Optional: true
        }
    ]
}; 
