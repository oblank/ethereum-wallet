import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { inject, observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { Button } from '@components/widgets';
import { colors, measures } from '@common/styles';
import { Transactions as TransactionActions } from '@common/actions';
import { Image as ImageUtils, Transaction as TransactionUtils, Wallet as WalletUtils } from '@common/utils';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';

@inject('prices', 'wallet')
@observer
export class ConfirmTransaction extends React.Component {
    
    static navigationOptions = { title: 'Confirm transaction' };

    state = { txn: null, error: null };

    get actionButton() {
        if (this.props.wallet.loading) return <ActivityIndicator loading />;
        const buttonConfig = ((this.state.txn && this.state.txn.hash) || this.state.error) ?
            { title: 'Return to wallet', action: this.onPressReturn } : { title: 'Confirm & send', action: this.onPressSend };
         return <Button children={buttonConfig.title} onPress={buttonConfig.action} />;
    }

    get estimatedFee() {
        const estimate = WalletUtils.estimateFee(this.state.txn);
        return WalletUtils.formatBalance(estimate);
    }
    
    get fiatAmount() {
        const { txn } = this.state;
        return Number(this.props.prices.usd * Number(WalletUtils.formatBalance(txn.value))).toFixed(2);
    }
    
    get fiatEstimatedFee() {
        return Number(this.props.prices.usd * Number(this.estimatedFee)).toFixed(2);
    }

    componentWillMount() {
        const {
            navigation: { state: { params: { address, amount } } }
        } = this.props;
        const txn = TransactionUtils.createTransaction(address, amount);
        this.setState({ txn });
    }

    @autobind
    async onPressSend() {
        const { wallet } = this.props;
        wallet.isLoading(true);
        try {
            const txn = await TransactionActions.sendTransaction(wallet.item, this.state.txn);
            this.setState({ txn });
        } catch (error) {
            this.setState({ error });
        } finally {
            wallet.isLoading(false);
        }
    }

    @autobind
    onPressReturn() {
        const { wallet } = this.props;
        this.props.navigation.navigate('WalletDetails', { wallet: wallet.item, replaceRoute: true, leave: 2 });
    }

    render() {
        const { estimatedGas, error, txn } = this.state;
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.row}>
                        <View style={styles.textColumn}>
                            <Text style={styles.title}>Wallet address</Text>
                            <Text style={styles.value}
                                numberOfLines={1}
                                ellipsizeMode="middle"
                                children={txn.to} />
                        </View>
                        <Image style={styles.avatar}
                            source={{ uri: ImageUtils.generateAvatar(txn.to) }} />
                    </View>
                    <View style={styles.textColumn}>
                        <Text style={styles.title}>Amount (ETH)</Text>
                        <Text style={styles.value}>{WalletUtils.formatBalance(txn.value)} (US$ {this.fiatAmount})</Text>
                    </View>
                    <View style={styles.textColumn}>
                        <Text style={styles.title}>Estimated fee (ETH)</Text>
                        <Text style={styles.value}>{this.estimatedFee} (US$ {this.fiatEstimatedFee})</Text>
                    </View>
                </View>
                <SuccessMessage txn={txn} />
                <ErrorMessage error={error} />
                {this.actionButton}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: measures.defaultPadding,
        alignItems: 'stretch',
        justifyContent: 'space-between'
    },
    content: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'flex-start'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    textColumn: {
        marginVertical: measures.defaultMargin
    },
    title: {
        fontSize: measures.fontSizeMedium + 1,
        fontWeight: 'bold'
    },
    value: {
        fontSize: measures.fontSizeMedium,
        width: 200
    },
    avatar: {
        width: 100,
        height: 100
    }
});