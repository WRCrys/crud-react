import React, { Component } from 'react';
import { Table, Button, Form, FormGroup, Label, Input, Alert } from 'reactstrap';
import PubSub from 'pubsub-js';

export class FormProduct extends Component {

    state = { model: { id: 0, descricao: '', preco: 0, quantidade: 0 } };

    setValues = (e, field) => {
        const { model } = this.state;
        model[field] = e.target.value;
        this.setState({ model });
    }

    create = () => {

        this.setState({ model: { id: 0, descricao: '', preco: 0, quantidade: 0 } });
        this.props.productCreate(this.state.model);
    }

    componentWillMount() {
        PubSub.subscribe('edit-product', (topic, product) => {
            this.setState({ model: product });
        });
    }

    render() {
        return (
            <Form>
                <FormGroup>
                    <Label for="descricao">Descrição: </Label>
                    <Input id="descricao" type="text" value={this.state.model.descricao} placeholder="Descrição do produto" onChange={e => this.setValues(e, 'descricao')} />
                </FormGroup>
                <FormGroup>
                    <div className="form-row">
                        <div className="col-md-6">
                            <Label for="preco">Preço: </Label>
                            <Input id="preco" type="text" value={this.state.model.preco} placeholder="R$" onChange={e => this.setValues(e, 'preco')} />
                        </div>
                        <div className="col-md-6">
                            <Label for="quantidade">Quantidade: </Label>
                            <Input id="quantidade" type="text" value={this.state.model.quantidade} placeholder="Quantidade do produto" onChange={e => this.setValues(e, 'quantidade')} />
                        </div>
                    </div>
                </FormGroup>
                <Button block color="success" onClick={this.create}>Salvar</Button>
            </Form>
        );
    }
}

export class ListProduct extends Component {

    onEdit = (product) => {
        PubSub.publish('edit-product', product);
    }

    delete = (id) => {
        this.props.deleteProduct(id);
    }

    render() {

        const { products } = this.props;

        return (
            <Table className="table-bordered text-center">
                <thead className="thead-dark">
                    <tr>
                        <th>Descrição</th>
                        <th>Preço</th>
                        <th>Quant.</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        products.map(product => (
                            <tr key={product.id}>
                                <td>{product.descricao}</td>
                                <td>{product.preco}</td>
                                <td>{product.quantidade}</td>
                                <td>
                                    <Button color="info" size="sm" onClick={e => this.onEdit(product)}>Editar</Button>
                                    <Button color="danger" size="sm" onClick={e => this.delete(product.id)}>Apagar</Button>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </Table>
        );
    }
}

export default class ProductBox extends Component {

    Url = 'https://localhost:44300/api/produtos';

    state = {
        products: [],
        message: {
            text: '',
            alert: ''
        }
    }

    componentDidMount() {
        fetch(this.Url)
            .then(response => response.json())
            .then(products => this.setState({ products }))
            .catch(error => console.log(error))
    }

    save = (product) => {

        let data = {
            id: parseInt(product.id),
            descricao: product.descricao,
            preco: parseFloat(product.preco),
            quantidade: parseFloat(product.quantidade)
        };

        const requestInfo = {
            method: data.id !== 0 ? 'PUT' : 'POST',
            body: JSON.stringify(data),
            headers: new Headers({
                'Content-type': 'application/json'
            })
        };

        if (data.id === 0) {
            /**
             * Create new product
             */
            fetch(this.Url, requestInfo)
                .then(response => response.json())
                .then(newProduct => {
                    let { products } = this.state;
                    products.push(newProduct);
                    this.setState({ products, message: { text: 'Produto cadastrado com sucesso!', alert: 'success' } });
                    this.timerMessage(3000);
                })
                .catch(error => console.log(error));

        } else {
            /**
             * Update product
             */
            fetch(`${this.Url}/${data.id}`, requestInfo)
            .then(response => response.json())
            .then(updatedProduct => {
                let { products } = this.state;
                let position = products.findIndex(product => product.id === data.id);
                products[position] = updatedProduct;
                this.setState({ products, message: { text: 'Produto atualizado com sucesso!', alert: 'info' } });
                this.timerMessage(3000);
            })
            .catch(e => console.log(e)); 
        }
    }

    delete = (id) => {
        fetch(`${this.Url}/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(rows => {
                const products = this.state.products.filter(product => product.id !== id);
                this.setState({ products, message: { text: 'Produto apagado com sucesso!', alert: 'danger' } });
                this.timerMessage(3000);
            })
            .catch(error => console.log(error));
    }

    timerMessage = (duration) => {
        setTimeout(() => {
            this.setState({ message: { text: '', alert: ''} });
        }, duration);
    }

    render() {
        return (
            <div>
                {
                    this.state.message.text !== '' ? (
                        <Alert color={this.state.message.alert} >{this.state.message.text}</Alert>
                    ) : ''
                }

                <div className="row">
                    <div className="col-md-6 my-3">
                        <h2 className="font-weight-bold text-center">Cadastro de Produtos</h2>
                        <FormProduct productCreate={this.save} />
                    </div>
                    <div className="col-md-6 my-3">
                        <h2 className="font-weight-bold text-center">Lista de Produtos</h2>
                        <ListProduct products={this.state.products} deleteProduct={this.delete} />
                    </div>
                </div>
            </div>
        );
    }
}