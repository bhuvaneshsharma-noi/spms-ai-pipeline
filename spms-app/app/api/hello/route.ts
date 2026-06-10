import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'helloData.json');

// Helper function to read data from the JSON file
const readData = () => {
    if (!fs.existsSync(dataFilePath)) {
        return [];
    }
    const jsonData = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(jsonData);
};

// Helper function to write data to the JSON file
const writeData = (data: any) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// GET method to retrieve hello data
export async function GET() {
    const data = readData();
    return NextResponse.json(data);
}

// POST method to add new hello data
export async function POST(request: Request) {
    try {
        const newData = await request.json();
        if (!newData.message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        const data = readData();
        data.push(newData);
        writeData(data);
        return NextResponse.json(newData, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
}

// PUT method to update existing hello data
export async function PUT(request: Request) {
    try {
        const updatedData = await request.json();
        if (!updatedData.id || !updatedData.message) {
            return NextResponse.json({ error: 'ID and message are required' }, { status: 400 });
        }
        const data = readData();
        const index = data.findIndex((item: any) => item.id === updatedData.id);
        if (index === -1) {
            return NextResponse.json({ error: 'Data not found' }, { status: 404 });
        }
        data[index] = updatedData;
        writeData(data);
        return NextResponse.json(updatedData);
    } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
}

// DELETE method to remove hello data
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }
        const data = readData();
        const newData = data.filter((item: any) => item.id !== id);
        if (newData.length === data.length) {
            return NextResponse.json({ error: 'Data not found' }, { status: 404 });
        }
        writeData(newData);
        return NextResponse.json({ message: 'Data deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
}